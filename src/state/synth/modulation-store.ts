/**
 * Zustand store for modulation matrix state.
 * Per-track modulation routes, serializable for session persistence.
 */

import { create } from "zustand";
import {
  createModRoute,
  MAX_MOD_ROUTES,
  type ModRoute,
  type ModSource,
  type ModDestination,
  MOD_SOURCES,
  MOD_DESTINATIONS,
} from "@audio/synth/modulation-types";
import {
  SOURCE_INDEX,
  DEST_INDEX,
  type WorkletModRoute,
} from "@audio/synth/modulation-engine";

type TrackModMatrix = {
  readonly routes: readonly ModRoute[];
};

export type ModulationStore = {
  matrices: Record<string, TrackModMatrix>;

  initMatrix: (trackId: string) => void;
  removeMatrix: (trackId: string) => void;
  addRoute: (
    trackId: string,
    source: ModSource,
    destination: ModDestination,
    amount?: number,
    bipolar?: boolean,
  ) => void;
  removeRoute: (trackId: string, routeId: string) => void;
  updateRouteAmount: (trackId: string, routeId: string, amount: number) => void;
  toggleRouteBipolar: (trackId: string, routeId: string) => void;
  getRoutes: (trackId: string) => readonly ModRoute[];
  getWorkletRoutes: (trackId: string) => WorkletModRoute[];
};

export const useModulationStore = create<ModulationStore>()((set, get) => ({
  matrices: {},

  initMatrix(trackId) {
    set((s) => {
      if (s.matrices[trackId]) return s;
      return {
        matrices: {
          ...s.matrices,
          [trackId]: { routes: [] },
        },
      };
    });
  },

  removeMatrix(trackId) {
    set((s) => {
      if (!s.matrices[trackId]) return s;
      return {
        matrices: Object.fromEntries(
          Object.entries(s.matrices).filter(([k]) => k !== trackId),
        ),
      };
    });
  },

  addRoute(trackId, source, destination, amount = 0, bipolar = true) {
    set((s) => {
      const matrix = s.matrices[trackId];
      if (!matrix) return s;
      if (matrix.routes.length >= MAX_MOD_ROUTES) return s;
      const route = createModRoute(source, destination, amount, bipolar);
      return {
        matrices: {
          ...s.matrices,
          [trackId]: { routes: [...matrix.routes, route] },
        },
      };
    });
  },

  removeRoute(trackId, routeId) {
    set((s) => {
      const matrix = s.matrices[trackId];
      if (!matrix) return s;
      return {
        matrices: {
          ...s.matrices,
          [trackId]: {
            routes: matrix.routes.filter((r) => r.id !== routeId),
          },
        },
      };
    });
  },

  updateRouteAmount(trackId, routeId, amount) {
    const clamped = Math.max(-1, Math.min(1, amount));
    set((s) => {
      const matrix = s.matrices[trackId];
      if (!matrix) return s;
      return {
        matrices: {
          ...s.matrices,
          [trackId]: {
            routes: matrix.routes.map((r) =>
              r.id === routeId ? { ...r, amount: clamped } : r,
            ),
          },
        },
      };
    });
  },

  toggleRouteBipolar(trackId, routeId) {
    set((s) => {
      const matrix = s.matrices[trackId];
      if (!matrix) return s;
      return {
        matrices: {
          ...s.matrices,
          [trackId]: {
            routes: matrix.routes.map((r) =>
              r.id === routeId ? { ...r, bipolar: !r.bipolar } : r,
            ),
          },
        },
      };
    });
  },

  getRoutes(trackId) {
    return get().matrices[trackId]?.routes ?? [];
  },

  getWorkletRoutes(trackId) {
    const routes = get().matrices[trackId]?.routes ?? [];
    return routes.map((r) => ({
      sourceIdx: SOURCE_INDEX[r.source],
      destIdx: DEST_INDEX[r.destination],
      amount: r.amount,
      bipolar: r.bipolar,
    }));
  },
}));

/** Source display labels */
export const MOD_SOURCE_LABELS: Record<ModSource, string> = {
  lfo1: "LFO 1",
  lfo2: "LFO 2",
  ampEnv: "Amp Env",
  filterEnv: "Filter Env",
  velocity: "Velocity",
  aftertouch: "Aftertouch",
  modWheel: "Mod Wheel",
  pitchBend: "Pitch Bend",
};

/** Destination display labels */
export const MOD_DEST_LABELS: Record<ModDestination, string> = {
  osc1Pitch: "Osc 1 Pitch",
  osc2Pitch: "Osc 2 Pitch",
  oscMix: "Osc Mix",
  filterCutoff: "Filter Cutoff",
  filterResonance: "Filter Reso",
  ampLevel: "Amp Level",
  lfo1Rate: "LFO 1 Rate",
  lfo2Rate: "LFO 2 Rate",
};

// Re-export for convenience
export { MOD_SOURCES, MOD_DESTINATIONS };
