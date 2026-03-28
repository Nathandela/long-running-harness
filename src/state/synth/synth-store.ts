/**
 * Zustand store for synthesizer state.
 * Per-instrument-track synth parameter state, serializable.
 */

import { create } from "zustand";
import {
  DEFAULT_SYNTH_PARAMS,
  type SynthParameterMap,
} from "@audio/synth/synth-types";

export type SynthTrackState = {
  readonly trackId: string;
  readonly params: SynthParameterMap;
  readonly legato: boolean;
};

export type SynthStore = {
  /** Per-track synth state keyed by track ID */
  synths: Record<string, SynthTrackState>;

  /** Initialize synth state for a track */
  initSynth: (trackId: string) => void;
  /** Remove synth state for a track */
  removeSynth: (trackId: string) => void;
  /** Set a synth parameter for a track */
  setParam: <K extends keyof SynthParameterMap>(
    trackId: string,
    key: K,
    value: SynthParameterMap[K],
  ) => void;
  /** Toggle legato mode */
  setLegato: (trackId: string, legato: boolean) => void;
  /** Get synth params for a track (returns defaults if not initialized) */
  getParams: (trackId: string) => SynthParameterMap;
};

export const useSynthStore = create<SynthStore>()((set, get) => ({
  synths: {},

  initSynth(trackId) {
    set((s) => {
      if (s.synths[trackId]) return s;
      return {
        synths: {
          ...s.synths,
          [trackId]: {
            trackId,
            params: { ...DEFAULT_SYNTH_PARAMS },
            legato: false,
          },
        },
      };
    });
  },

  removeSynth(trackId) {
    set((s) => {
      if (!s.synths[trackId]) return s;
      return {
        synths: Object.fromEntries(
          Object.entries(s.synths).filter(([k]) => k !== trackId),
        ),
      };
    });
  },

  setParam(trackId, key, value) {
    set((s) => {
      const synth = s.synths[trackId];
      if (!synth) return s;
      return {
        synths: {
          ...s.synths,
          [trackId]: {
            ...synth,
            params: { ...synth.params, [key]: value },
          },
        },
      };
    });
  },

  setLegato(trackId, legato) {
    set((s) => {
      const synth = s.synths[trackId];
      if (!synth) return s;
      return {
        synths: {
          ...s.synths,
          [trackId]: { ...synth, legato },
        },
      };
    });
  },

  getParams(trackId) {
    const synth = get().synths[trackId];
    return synth?.params ?? { ...DEFAULT_SYNTH_PARAMS };
  },
}));
