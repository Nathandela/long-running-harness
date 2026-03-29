/**
 * Bridge between the track Zustand store and live WebAudio instrument instances.
 * Subscribes to track additions/removals, creates/disposes SynthInstrument
 * and DrumKit instances, and forwards store parameter changes to audio engines.
 *
 * Follows the same pattern as EffectsBridge and RoutingBridge.
 */

import { useDawStore } from "@state/store";
import { useSynthStore } from "@state/synth/synth-store";
import type { SynthParameterMap } from "./synth/synth-types";
import {
  createSynthInstrument,
  type SynthInstrument,
} from "./synth/synth-instrument";
import { subscribeModRoutes } from "./synth/modulation-bridge";
import { createDrumKit } from "./drum-machine/drum-kit";
import type { DrumKit } from "./drum-machine/drum-types";
import {
  DRUM_INSTRUMENTS,
  type DrumInstrumentId,
} from "./drum-machine/drum-types";
import type { MixerEngine } from "./mixer/types";
import type { TrackModel } from "@state/track/types";

export type TrackAudioBridge = {
  getInstrument(trackId: string): SynthInstrument | undefined;
  getDrumKit(trackId: string): DrumKit | undefined;
  dispose(): void;
};

/**
 * Subscribe a SynthInstrument to param changes from useSynthStore.
 * Sends current params immediately, then diffs future changes.
 */
function subscribeSynthParams(
  trackId: string,
  instrument: SynthInstrument,
): () => void {
  // Send current params
  const current = useSynthStore.getState().getParams(trackId);
  for (const key of Object.keys(current) as (keyof SynthParameterMap)[]) {
    instrument.setParam(key, current[key]);
  }

  let prevRef = useSynthStore.getState().synths[trackId];

  return useSynthStore.subscribe((state) => {
    const synth = state.synths[trackId];
    if (!synth || synth === prevRef) return;

    const prevParams = prevRef?.params;
    prevRef = synth;

    if (!prevParams) return;

    for (const key of Object.keys(
      synth.params,
    ) as (keyof SynthParameterMap)[]) {
      if (synth.params[key] !== prevParams[key]) {
        instrument.setParam(key, synth.params[key]);
      }
    }
  });
}

/** Create silent placeholder AudioBuffers for each drum instrument. */
function createPlaceholderSamples(
  ctx: AudioContext,
): Map<DrumInstrumentId, AudioBuffer> {
  const samples = new Map<DrumInstrumentId, AudioBuffer>();
  for (const inst of DRUM_INSTRUMENTS) {
    samples.set(inst.id, ctx.createBuffer(1, 1, ctx.sampleRate));
  }
  return samples;
}

export function createTrackAudioBridge(
  ctx: AudioContext,
  mixer: MixerEngine,
): TrackAudioBridge {
  const instruments = new Map<string, SynthInstrument>();
  const drumKits = new Map<string, DrumKit>();
  const trackCleanups = new Map<string, () => void>();
  // Generation counter to detect stale async instrument resolutions
  const trackGeneration = new Map<string, number>();
  let disposed = false;

  function addInstrumentTrack(trackId: string): void {
    const gen = (trackGeneration.get(trackId) ?? 0) + 1;
    trackGeneration.set(trackId, gen);
    mixer.getOrCreateStrip(trackId);
    useSynthStore.getState().initSynth(trackId);

    void createSynthInstrument(ctx).then((instrument) => {
      if (trackGeneration.get(trackId) !== gen || disposed) {
        instrument.dispose();
        return;
      }

      instruments.set(trackId, instrument);
      instrument.connectToMixer(mixer, trackId);

      const unsubParams = subscribeSynthParams(trackId, instrument);
      const unsubMod = subscribeModRoutes(trackId, instrument);

      trackCleanups.set(trackId, () => {
        unsubParams();
        unsubMod();
        instrument.disconnectFromMixer(mixer, trackId);
        instrument.dispose();
        instruments.delete(trackId);
      });
    });
  }

  function addDrumTrack(trackId: string): void {
    const samples = createPlaceholderSamples(ctx);
    const kit = createDrumKit(ctx, samples);
    drumKits.set(trackId, kit);
    kit.connectToMixer(mixer, trackId);

    trackCleanups.set(trackId, () => {
      kit.disconnectFromMixer(mixer, trackId);
      kit.dispose();
      drumKits.delete(trackId);
    });
  }

  function addAudioTrack(trackId: string): void {
    mixer.getOrCreateStrip(trackId);
    trackCleanups.set(trackId, () => {
      mixer.removeStrip(trackId);
    });
  }

  function handleTrackAdded(track: TrackModel): void {
    switch (track.type) {
      case "instrument":
        addInstrumentTrack(track.id);
        break;
      case "drum":
        addDrumTrack(track.id);
        break;
      case "audio":
        addAudioTrack(track.id);
        break;
    }
  }

  function handleTrackRemoved(trackId: string): void {
    // Bump generation so in-flight async instrument creation is discarded
    trackGeneration.set(trackId, (trackGeneration.get(trackId) ?? 0) + 1);
    trackCleanups.get(trackId)?.();
    trackCleanups.delete(trackId);
    mixer.removeStrip(trackId);
    useSynthStore.getState().removeSynth(trackId);
  }

  // Sync existing tracks on creation
  let prevTrackMap = new Map<string, TrackModel>();
  const initialTracks = useDawStore.getState().tracks;
  for (const track of initialTracks) {
    handleTrackAdded(track);
    prevTrackMap.set(track.id, track);
  }

  // Subscribe to future track changes
  const unsubStore = useDawStore.subscribe((state) => {
    const current = new Map(state.tracks.map((t) => [t.id, t]));

    // Added
    for (const [id, track] of current) {
      if (!prevTrackMap.has(id)) {
        handleTrackAdded(track);
      }
    }

    // Removed
    for (const id of prevTrackMap.keys()) {
      if (!current.has(id)) {
        handleTrackRemoved(id);
      }
    }

    prevTrackMap = current;
  });

  return {
    getInstrument(trackId: string): SynthInstrument | undefined {
      return instruments.get(trackId);
    },

    getDrumKit(trackId: string): DrumKit | undefined {
      return drumKits.get(trackId);
    },

    dispose(): void {
      disposed = true;
      unsubStore();

      for (const cleanup of trackCleanups.values()) {
        cleanup();
      }
      trackCleanups.clear();
      trackGeneration.clear();
    },
  };
}
