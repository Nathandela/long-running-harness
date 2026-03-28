/**
 * Zustand store for per-track arpeggiator state.
 * Follows synth-store.ts pattern: keyed by track ID.
 */

import { create } from "zustand";
import type { ArpParams } from "@audio/arpeggiator/arpeggiator-types";
import { DEFAULT_ARP_PARAMS } from "@audio/arpeggiator/arpeggiator-types";

export type ArpTrackState = {
  readonly trackId: string;
  readonly params: ArpParams;
};

export type ArpeggiatorStore = {
  /** Per-track arpeggiator state keyed by track ID */
  arps: Record<string, ArpTrackState>;

  /** Initialize arpeggiator state for a track */
  initArp: (trackId: string) => void;
  /** Remove arpeggiator state for a track */
  removeArp: (trackId: string) => void;
  /** Set a single arpeggiator parameter for a track */
  setParam: <K extends keyof ArpParams>(
    trackId: string,
    key: K,
    value: ArpParams[K],
  ) => void;
  /** Set all arpeggiator parameters for a track */
  setParams: (trackId: string, params: ArpParams) => void;
  /** Get arp params for a track (returns defaults if not initialized) */
  getParams: (trackId: string) => ArpParams;
};

export const useArpeggiatorStore = create<ArpeggiatorStore>()((set, get) => ({
  arps: {},

  initArp(trackId) {
    set((s) => {
      if (s.arps[trackId]) return s;
      return {
        arps: {
          ...s.arps,
          [trackId]: {
            trackId,
            params: { ...DEFAULT_ARP_PARAMS },
          },
        },
      };
    });
  },

  removeArp(trackId) {
    set((s) => {
      if (!s.arps[trackId]) return s;
      return {
        arps: Object.fromEntries(
          Object.entries(s.arps).filter(([k]) => k !== trackId),
        ),
      };
    });
  },

  setParam(trackId, key, value) {
    set((s) => {
      const arp = s.arps[trackId];
      if (!arp) return s;
      return {
        arps: {
          ...s.arps,
          [trackId]: {
            ...arp,
            params: { ...arp.params, [key]: value },
          },
        },
      };
    });
  },

  setParams(trackId, params) {
    set((s) => {
      const arp = s.arps[trackId];
      if (!arp) return s;
      return {
        arps: {
          ...s.arps,
          [trackId]: { ...arp, params },
        },
      };
    });
  },

  getParams(trackId) {
    const arp = get().arps[trackId];
    return arp?.params ?? { ...DEFAULT_ARP_PARAMS };
  },
}));
