/**
 * Zustand store for E13 routing state.
 * Per-track sends, bus definitions, and sidechain assignments.
 */

import { create } from "zustand";
import type { SendState, BusState, SidechainState } from "./types";

export type RoutingStore = {
  buses: Record<string, BusState>;
  sends: Record<string, readonly SendState[]>;
  sidechains: readonly SidechainState[];

  addBus: (bus: BusState) => void;
  removeBus: (id: string) => void;
  setBusOutput: (busId: string, targetId: string) => void;

  addSend: (trackId: string, send: SendState) => void;
  removeSend: (trackId: string, busId: string) => void;
  updateSendLevel: (trackId: string, busId: string, level: number) => void;
  togglePreFader: (trackId: string, busId: string) => void;
  removeTrackSends: (trackId: string) => void;
  getSends: (trackId: string) => readonly SendState[];

  addSidechain: (sc: SidechainState) => void;
  removeSidechain: (sourceId: string, targetId: string) => void;
  getSidechains: (targetId: string) => readonly SidechainState[];
};

export const useRoutingStore = create<RoutingStore>()((set, get) => ({
  buses: {},
  sends: {},
  sidechains: [],

  addBus(bus) {
    set((s) => ({
      buses: { ...s.buses, [bus.id]: bus },
    }));
  },

  removeBus(id) {
    set((s) => {
      const buses = Object.fromEntries(
        Object.entries(s.buses)
          .filter(([k]) => k !== id)
          .map(([k, bus]) =>
            bus.outputTarget === id
              ? [k, { ...bus, outputTarget: "master" }]
              : [k, bus],
          ),
      );
      const sends = Object.fromEntries(
        Object.entries(s.sends)
          .map(
            ([trackId, trackSends]) =>
              [
                trackId,
                trackSends.filter((send) => send.busId !== id),
              ] as const,
          )
          .filter(([, filtered]) => filtered.length > 0),
      );
      const sidechains = s.sidechains.filter(
        (sc) => sc.sourceId !== id && sc.targetId !== id,
      );
      return { buses, sends, sidechains };
    });
  },

  setBusOutput(busId, targetId) {
    set((s) => {
      const bus = s.buses[busId];
      if (!bus) return s;
      return {
        buses: { ...s.buses, [busId]: { ...bus, outputTarget: targetId } },
      };
    });
  },

  addSend(trackId, send) {
    set((s) => {
      const existing = s.sends[trackId] ?? [];
      if (existing.some((e) => e.busId === send.busId)) return s;
      return {
        sends: { ...s.sends, [trackId]: [...existing, send] },
      };
    });
  },

  removeSend(trackId, busId) {
    set((s) => {
      const existing = s.sends[trackId];
      if (!existing) return s;
      const next = existing.filter((send) => send.busId !== busId);
      if (next.length === 0) {
        return {
          sends: Object.fromEntries(
            Object.entries(s.sends).filter(([k]) => k !== trackId),
          ),
        };
      }
      return { sends: { ...s.sends, [trackId]: next } };
    });
  },

  updateSendLevel(trackId, busId, level) {
    set((s) => {
      const existing = s.sends[trackId];
      if (!existing) return s;
      const clamped = Math.min(1, Math.max(0, level));
      return {
        sends: {
          ...s.sends,
          [trackId]: existing.map((send) =>
            send.busId === busId ? { ...send, level: clamped } : send,
          ),
        },
      };
    });
  },

  togglePreFader(trackId, busId) {
    set((s) => {
      const existing = s.sends[trackId];
      if (!existing) return s;
      return {
        sends: {
          ...s.sends,
          [trackId]: existing.map((send) =>
            send.busId === busId ? { ...send, preFader: !send.preFader } : send,
          ),
        },
      };
    });
  },

  removeTrackSends(trackId) {
    set((s) => ({
      sends: Object.fromEntries(
        Object.entries(s.sends).filter(([k]) => k !== trackId),
      ),
    }));
  },

  getSends(trackId) {
    return get().sends[trackId] ?? [];
  },

  addSidechain(sc) {
    set((s) => {
      const exists = s.sidechains.some(
        (existing) =>
          existing.sourceId === sc.sourceId &&
          existing.targetId === sc.targetId,
      );
      if (exists) return s;
      return { sidechains: [...s.sidechains, sc] };
    });
  },

  removeSidechain(sourceId, targetId) {
    set((s) => ({
      sidechains: s.sidechains.filter(
        (sc) => !(sc.sourceId === sourceId && sc.targetId === targetId),
      ),
    }));
  },

  getSidechains(targetId) {
    return get().sidechains.filter((sc) => sc.targetId === targetId);
  },
}));
