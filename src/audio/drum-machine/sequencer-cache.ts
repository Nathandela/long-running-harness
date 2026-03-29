/**
 * Module-level caches for drum machine sequencers and instrument parameters.
 * Extracted to avoid circular dependencies between panels.tsx and TrackAudioBridgeProvider.
 */

import { createStepSequencer, type StepSequencer } from "./step-sequencer";
import {
  DRUM_INSTRUMENTS,
  DEFAULT_INSTRUMENT_PARAMS,
  type DrumInstrumentId,
  type DrumInstrumentParams,
} from "./drum-types";
import type { TrackAudioBridge } from "@audio/track-audio-bridge";
import { useDawStore } from "@state/store";

export const sequencerCache = new Map<string, StepSequencer>();
export const paramsCache = new Map<
  string,
  Record<DrumInstrumentId, DrumInstrumentParams>
>();

// Module-level bridge reference for trigger callbacks
let bridgeRef: TrackAudioBridge | null = null;

export function setBridgeRef(bridge: TrackAudioBridge | null): void {
  bridgeRef = bridge;
}

export function getOrCreateSequencer(trackId: string): StepSequencer {
  let seq = sequencerCache.get(trackId);
  if (!seq) {
    seq = createStepSequencer((trigger) => {
      const bridge = bridgeRef;
      if (!bridge) return;
      const kit = bridge.getDrumKit(trackId);
      kit?.trigger(
        trigger.instrumentId,
        trigger.time,
        trigger.velocity,
        trigger.flamMs,
      );
    });
    sequencerCache.set(trackId, seq);
  }
  return seq;
}

export function getOrCreateParams(
  trackId: string,
): Record<DrumInstrumentId, DrumInstrumentParams> {
  let cached = paramsCache.get(trackId);
  if (!cached) {
    cached = {} as Record<DrumInstrumentId, DrumInstrumentParams>;
    for (const inst of DRUM_INSTRUMENTS) {
      cached[inst.id] = { ...DEFAULT_INSTRUMENT_PARAMS[inst.id] };
    }
    paramsCache.set(trackId, cached);
  }
  return cached;
}

// Clean up caches when tracks are removed
let prevTrackIds = new Set(useDawStore.getState().tracks.map((t) => t.id));
useDawStore.subscribe((state) => {
  const trackIds = new Set(state.tracks.map((t) => t.id));
  for (const id of prevTrackIds) {
    if (!trackIds.has(id)) {
      sequencerCache.delete(id);
      paramsCache.delete(id);
    }
  }
  prevTrackIds = trackIds;
});
