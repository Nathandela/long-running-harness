/**
 * Zustand store for per-track automation lanes.
 * Follows effects-store.ts pattern: keyed by track ID.
 */

import { create } from "zustand";
import type {
  AutomationLane,
  AutomationMode,
  AutomationPoint,
  ParameterTarget,
} from "@audio/automation";
import {
  insertPoint as insertPt,
  removePoint as removePt,
  movePoint as movePt,
  targetsEqual,
} from "@audio/automation";
import { nextLaneId } from "@audio/automation/automation-types";

export type AutomationStore = {
  /** Per-track automation lanes keyed by track ID */
  lanes: Record<string, readonly AutomationLane[]>;

  addLane: (trackId: string, target: ParameterTarget) => void;
  removeLane: (trackId: string, laneId: string) => void;
  removeTrackLanes: (trackId: string) => void;
  addPoint: (trackId: string, laneId: string, point: AutomationPoint) => void;
  removePoint: (trackId: string, laneId: string, pointId: string) => void;
  movePoint: (
    trackId: string,
    laneId: string,
    pointId: string,
    newTime: number,
    newValue: number,
  ) => void;
  setMode: (trackId: string, laneId: string, mode: AutomationMode) => void;
  setArmed: (trackId: string, laneId: string, armed: boolean) => void;
  getLanes: (trackId: string) => readonly AutomationLane[];
  getLane: (trackId: string, laneId: string) => AutomationLane | undefined;
};

function updateLane(
  lanes: readonly AutomationLane[],
  laneId: string,
  updater: (lane: AutomationLane) => AutomationLane,
): readonly AutomationLane[] {
  return lanes.map((l) => (l.id === laneId ? updater(l) : l));
}

export const useAutomationStore = create<AutomationStore>()((set, get) => ({
  lanes: {},

  addLane(trackId, target) {
    set((s) => {
      const existing = s.lanes[trackId] ?? [];
      // Reject duplicate: one lane per target per track
      if (existing.some((l) => targetsEqual(l.target, target))) return s;
      const lane: AutomationLane = {
        id: nextLaneId(),
        trackId,
        target,
        points: [],
        mode: "read",
        armed: true,
      };
      return {
        lanes: { ...s.lanes, [trackId]: [...existing, lane] },
      };
    });
  },

  removeLane(trackId, laneId) {
    set((s) => {
      const existing = s.lanes[trackId];
      if (!existing) return s;
      const next = existing.filter((l) => l.id !== laneId);
      if (next.length === 0) {
        return {
          lanes: Object.fromEntries(
            Object.entries(s.lanes).filter(([k]) => k !== trackId),
          ),
        };
      }
      return { lanes: { ...s.lanes, [trackId]: next } };
    });
  },

  removeTrackLanes(trackId) {
    set((s) => {
      if (!s.lanes[trackId]) return s;
      return {
        lanes: Object.fromEntries(
          Object.entries(s.lanes).filter(([k]) => k !== trackId),
        ),
      };
    });
  },

  addPoint(trackId, laneId, point) {
    set((s) => {
      const existing = s.lanes[trackId];
      if (!existing) return s;
      return {
        lanes: {
          ...s.lanes,
          [trackId]: updateLane(existing, laneId, (l) => ({
            ...l,
            points: insertPt(l.points, point),
          })),
        },
      };
    });
  },

  removePoint(trackId, laneId, pointId) {
    set((s) => {
      const existing = s.lanes[trackId];
      if (!existing) return s;
      return {
        lanes: {
          ...s.lanes,
          [trackId]: updateLane(existing, laneId, (l) => ({
            ...l,
            points: removePt(l.points, pointId),
          })),
        },
      };
    });
  },

  movePoint(trackId, laneId, pointId, newTime, newValue) {
    set((s) => {
      const existing = s.lanes[trackId];
      if (!existing) return s;
      return {
        lanes: {
          ...s.lanes,
          [trackId]: updateLane(existing, laneId, (l) => ({
            ...l,
            points: movePt(l.points, pointId, newTime, newValue),
          })),
        },
      };
    });
  },

  setMode(trackId, laneId, mode) {
    set((s) => {
      const existing = s.lanes[trackId];
      if (!existing) return s;
      return {
        lanes: {
          ...s.lanes,
          [trackId]: updateLane(existing, laneId, (l) => ({
            ...l,
            mode,
          })),
        },
      };
    });
  },

  setArmed(trackId, laneId, armed) {
    set((s) => {
      const existing = s.lanes[trackId];
      if (!existing) return s;
      return {
        lanes: {
          ...s.lanes,
          [trackId]: updateLane(existing, laneId, (l) => ({
            ...l,
            armed,
          })),
        },
      };
    });
  },

  getLanes(trackId) {
    return get().lanes[trackId] ?? [];
  },

  getLane(trackId, laneId) {
    const lanes = get().lanes[trackId];
    if (!lanes) return undefined;
    return lanes.find((l) => l.id === laneId);
  },
}));
