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

  // Prefetch clip buffers when clips change
  useEffect(() => {
    const unsub = useDawStore.subscribe((state) => {
      for (const clip of Object.values(state.clips)) {
        if (isAudioClip(clip) && !bufferCacheRef.current.has(clip.sourceId)) {
          void pool.getAudioBuffer(clip.sourceId).then((buf) => {
            if (buf) bufferCacheRef.current.set(clip.sourceId, buf);
          });
        }
      }
    });
    // Prefetch existing clips
    for (const clip of Object.values(useDawStore.getState().clips)) {
      if (isAudioClip(clip) && !bufferCacheRef.current.has(clip.sourceId)) {
        void pool.getAudioBuffer(clip.sourceId).then((buf) => {
          if (buf) bufferCacheRef.current.set(clip.sourceId, buf);
        });
      }
    }
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
            strip.inputGain as unknown as AudioNode,
          );
        }
      },
    );
  }, [transport, mixer, value.clipScheduler]);

  // Stop all clip playback when transport stops
  useEffect(() => {
    return useDawStore.subscribe((state, prev) => {
      if (
        prev.transportState !== "stopped" &&
        state.transportState === "stopped"
      ) {
        value.clipScheduler.stopAll();
      }
    });
  }, [value.clipScheduler]);

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
