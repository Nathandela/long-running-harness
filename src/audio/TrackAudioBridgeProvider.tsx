/**
 * Provider that creates the TrackAudioBridge and ClipScheduler.
 * Bridges track store changes to live WebAudio instrument/kit instances.
 * Must be rendered inside EffectsBridgeProvider (needs mixer access).
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAudioEngine } from "@audio/use-audio-engine";
import { useEffectsBridgeContext } from "@audio/effects/EffectsBridgeProvider";
import { useTransport } from "@audio/use-transport";
import { useMediaPool } from "@audio/media-pool/use-media-pool";
import { useDawStore } from "@state/store";
import { isAudioClip } from "@state/track/types";
import {
  createTrackAudioBridge,
  type TrackAudioBridge,
} from "./track-audio-bridge";
import {
  createClipScheduler,
  type ClipScheduler,
} from "./mixer/clip-scheduler";
import { sequencerCache } from "./drum-machine/sequencer-cache";

const Ctx = createContext<TrackAudioBridge | null>(null);

export function TrackAudioBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const engine = useAudioEngine();
  const { mixer } = useEffectsBridgeContext();
  const transport = useTransport();
  const pool = useMediaPool();

  const [value] = useState<{
    bridge: TrackAudioBridge;
    clipScheduler: ClipScheduler;
  }>(() => ({
    bridge: createTrackAudioBridge(engine.ctx, mixer),
    clipScheduler: createClipScheduler(engine.ctx),
  }));

  // Maintain a sync buffer cache for clip scheduling
  const bufferCacheRef = useRef(new Map<string, AudioBuffer>());
  const inFlightRef = useRef(new Set<string>());

  // Prefetch clip buffers when clips change; evict stale entries
  useEffect(() => {
    function syncBuffers(clips: Record<string, unknown>): void {
      const activeSourceIds = new Set<string>();
      for (const clip of Object.values(clips)) {
        if (isAudioClip(clip)) {
          activeSourceIds.add(clip.sourceId);
          if (
            !bufferCacheRef.current.has(clip.sourceId) &&
            !inFlightRef.current.has(clip.sourceId)
          ) {
            inFlightRef.current.add(clip.sourceId);
            const sid = clip.sourceId;
            void pool
              .getAudioBuffer(sid)
              .then((buf) => {
                // Re-check that this sourceId is still referenced by an active clip
                // before caching — the last clip may have been removed while in flight
                if (!buf) return;
                const currentClips = useDawStore.getState().clips;
                const stillActive = Object.values(currentClips).some(
                  (c) => isAudioClip(c) && c.sourceId === sid,
                );
                if (stillActive) {
                  bufferCacheRef.current.set(sid, buf);
                }
              })
              .catch((err: unknown) => {
                console.warn("Failed to prefetch buffer:", clip.sourceId, err);
              })
              .finally(() => {
                inFlightRef.current.delete(clip.sourceId);
              });
          }
        }
      }
      // Evict buffers for removed clips
      for (const sourceId of bufferCacheRef.current.keys()) {
        if (!activeSourceIds.has(sourceId)) {
          bufferCacheRef.current.delete(sourceId);
        }
      }
    }

    syncBuffers(useDawStore.getState().clips);
    const unsub = useDawStore.subscribe((state) => {
      syncBuffers(state.clips);
    });
    return unsub;
  }, [pool]);

  // Wire clip scheduler into transport's onAdvance callback
  useEffect(() => {
    transport.setOnAdvanceCallback(
      (windowStart: number, windowEnd: number, timeOffset: number) => {
        const state = useDawStore.getState();
        const audioClips = Object.values(state.clips).filter(isAudioClip);
        // Filter to non-muted tracks
        const hasSolo = state.tracks.some((t) => t.solo);
        const activeTrackIds = new Set(
          state.tracks
            .filter((t) => {
              if (t.muted) return false;
              if (hasSolo && !t.solo && !t.soloIsolate) return false;
              return true;
            })
            .map((t) => t.id),
        );
        const activeClips = audioClips.filter((c) =>
          activeTrackIds.has(c.trackId),
        );

        // Schedule clips per track (each goes to its own mixer strip)
        const byTrack = new Map<string, typeof activeClips>();
        for (const clip of activeClips) {
          const arr = byTrack.get(clip.trackId) ?? [];
          arr.push(clip);
          byTrack.set(clip.trackId, arr);
        }

        for (const [trackId, clips] of byTrack) {
          const strip = mixer.getStrip(trackId);
          if (!strip) continue;
          value.clipScheduler.scheduleClips(
            clips,
            windowStart,
            windowEnd,
            timeOffset,
            (sourceId) => bufferCacheRef.current.get(sourceId),
            strip.inputGain,
          );
        }
      },
    );
    return () => {
      transport.setOnAdvanceCallback(null);
    };
  }, [transport, mixer, value.clipScheduler]);

  // Stop all clip playback and silence synths when transport stops
  useEffect(() => {
    return useDawStore.subscribe((state, prev) => {
      if (
        prev.transportState !== "stopped" &&
        state.transportState === "stopped"
      ) {
        value.clipScheduler.stopAll();
        // allNotesOff on all synth instruments
        for (const track of state.tracks) {
          if (track.type === "instrument") {
            value.bridge.getInstrument(track.id)?.allNotesOff();
          }
        }
      }
    });
  }, [value.clipScheduler, value.bridge]);

  // Forward track volume/pan/mute/solo changes to MixerEngine
  useEffect(() => {
    let prevTracks = useDawStore.getState().tracks;
    return useDawStore.subscribe((state) => {
      for (const track of state.tracks) {
        const prev = prevTracks.find((t) => t.id === track.id);
        // For new tracks (!prev), apply initial values to sync mixer with store
        if (!prev || track.volume !== prev.volume) {
          mixer.setFaderLevel(track.id, track.volume);
        }
        if (!prev || track.pan !== prev.pan) {
          mixer.setPan(track.id, track.pan);
        }
        if (!prev || track.muted !== prev.muted) {
          mixer.setMute(track.id, track.muted);
        }
        if (!prev || track.solo !== prev.solo) {
          mixer.setSolo(track.id, track.solo);
        }
      }
      prevTracks = state.tracks;
    });
  }, [mixer]);

  // Persistent drum scheduling: runs for all drum tracks regardless of UI selection.
  // Moved here from useDrumMachineState (panels.tsx) so playback survives track deselection.
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    function startScheduling(): void {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }

      const state = useDawStore.getState();
      if (state.transportState !== "playing") return;

      const clock = transport.getClock();
      if (!clock) return;

      const drumTracks = state.tracks.filter((t) => t.type === "drum");
      if (drumTracks.length === 0) return;

      const stepsPerBeat = 4;
      const stepDuration = 60 / (state.bpm * stepsPerBeat);
      const lookAheadSec = 0.1;
      const intervalMs = 25;

      type PerTrack = {
        seq: { scheduleStep(step: number, time: number): void };
        nextStepIndex: number;
        nextStepArrangementTime: number;
        stepsLength: number;
      };
      const perTrack: PerTrack[] = [];

      for (const track of drumTracks) {
        const seq = sequencerCache.get(track.id);
        if (!seq) continue;
        const pattern = seq.getPattern();
        const cursor = clock.getCursorSeconds();
        const totalSteps = cursor / stepDuration;
        const wholeStep = Math.floor(totalSteps + 1e-9);
        const remainder = totalSteps - wholeStep;
        let nextStepIndex: number;
        let nextStepArrangementTime: number;
        if (remainder < 1e-6) {
          nextStepIndex = wholeStep % pattern.steps.length;
          nextStepArrangementTime = wholeStep * stepDuration;
        } else {
          nextStepIndex = (wholeStep + 1) % pattern.steps.length;
          nextStepArrangementTime = (wholeStep + 1) * stepDuration;
        }
        perTrack.push({
          seq,
          nextStepIndex,
          nextStepArrangementTime,
          stepsLength: pattern.steps.length,
        });
      }

      if (perTrack.length === 0) return;

      timerId = setInterval(() => {
        if (clock.state !== "playing") return;
        const cursorNow = clock.getCursorSeconds();
        const windowEnd = cursorNow + lookAheadSec;
        const timeOffset = engine.ctx.currentTime - cursorNow;

        for (const ts of perTrack) {
          while (ts.nextStepArrangementTime < windowEnd) {
            const audioTime = ts.nextStepArrangementTime + timeOffset;
            ts.seq.scheduleStep(ts.nextStepIndex, Math.max(0, audioTime));
            ts.nextStepIndex = (ts.nextStepIndex + 1) % ts.stepsLength;
            ts.nextStepArrangementTime += stepDuration;
          }
        }
      }, intervalMs);
    }

    // Start immediately if already playing
    startScheduling();

    // Re-evaluate when transport state, BPM, or tracks change
    const unsub = useDawStore.subscribe((state, prev) => {
      if (
        state.transportState !== prev.transportState ||
        state.bpm !== prev.bpm ||
        state.tracks !== prev.tracks
      ) {
        startScheduling();
      }
    });

    return () => {
      if (timerId !== null) clearInterval(timerId);
      unsub();
    };
  }, [transport, engine]);

  // Guard against StrictMode double-mount (same pattern as EffectsBridgeProvider)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) {
          value.clipScheduler.stopAll();
          value.bridge.dispose();
        }
      }, 0);
    };
  }, [value]);

  return <Ctx.Provider value={value.bridge}>{children}</Ctx.Provider>;
}

export function useTrackAudioBridge(): TrackAudioBridge {
  const bridge = useContext(Ctx);
  if (bridge === null) {
    throw new Error(
      "useTrackAudioBridge must be used within TrackAudioBridgeProvider",
    );
  }
  return bridge;
}
