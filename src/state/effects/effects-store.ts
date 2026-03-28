/**
 * Zustand store for effects rack state.
 * Per-track effect chain stored as serializable state.
 */

import { create } from "zustand";
import type { EffectSlotState } from "./types";

export type EffectsStore = {
  trackEffects: Record<string, readonly EffectSlotState[]>;

  addEffect: (trackId: string, slot: EffectSlotState) => void;
  removeEffect: (trackId: string, effectId: string) => void;
  updateEffectParam: (
    trackId: string,
    effectId: string,
    key: string,
    value: number,
  ) => void;
  toggleBypass: (trackId: string, effectId: string) => void;
  removeTrackEffects: (trackId: string) => void;
  swapEffectType: (
    trackId: string,
    effectId: string,
    newTypeId: string,
    newParams: Record<string, number>,
  ) => void;
  reorderEffect: (trackId: string, effectId: string, toIndex: number) => void;
  getTrackEffects: (trackId: string) => readonly EffectSlotState[];
};

export const useEffectsStore = create<EffectsStore>()((set, get) => ({
  trackEffects: {},

  addEffect(trackId, slot) {
    set((s) => {
      const existing = s.trackEffects[trackId] ?? [];
      return {
        trackEffects: {
          ...s.trackEffects,
          [trackId]: [...existing, slot],
        },
      };
    });
  },

  removeEffect(trackId, effectId) {
    set((s) => {
      const existing = s.trackEffects[trackId];
      if (!existing) return s;
      const next = existing.filter((e) => e.id !== effectId);
      if (next.length === 0) {
        return {
          trackEffects: Object.fromEntries(
            Object.entries(s.trackEffects).filter(([k]) => k !== trackId),
          ),
        };
      }
      return {
        trackEffects: { ...s.trackEffects, [trackId]: next },
      };
    });
  },

  updateEffectParam(trackId, effectId, key, value) {
    set((s) => {
      const existing = s.trackEffects[trackId];
      if (!existing) return s;
      return {
        trackEffects: {
          ...s.trackEffects,
          [trackId]: existing.map((e) =>
            e.id === effectId
              ? { ...e, params: { ...e.params, [key]: value } }
              : e,
          ),
        },
      };
    });
  },

  toggleBypass(trackId, effectId) {
    set((s) => {
      const existing = s.trackEffects[trackId];
      if (!existing) return s;
      return {
        trackEffects: {
          ...s.trackEffects,
          [trackId]: existing.map((e) =>
            e.id === effectId ? { ...e, bypassed: !e.bypassed } : e,
          ),
        },
      };
    });
  },

  removeTrackEffects(trackId) {
    set((s) => ({
      trackEffects: Object.fromEntries(
        Object.entries(s.trackEffects).filter(([k]) => k !== trackId),
      ),
    }));
  },

  swapEffectType(trackId, effectId, newTypeId, newParams) {
    set((s) => {
      const existing = s.trackEffects[trackId];
      if (!existing) return s;
      const idx = existing.findIndex((e) => e.id === effectId);
      if (idx === -1) return s;
      const slot = existing[idx];
      if (!slot) return s;
      return {
        trackEffects: {
          ...s.trackEffects,
          [trackId]: existing.map((e, i) =>
            i === idx ? { ...e, typeId: newTypeId, params: newParams } : e,
          ),
        },
      };
    });
  },

  reorderEffect(trackId, effectId, toIndex) {
    set((s) => {
      const existing = s.trackEffects[trackId];
      if (!existing) return s;
      const fromIndex = existing.findIndex((e) => e.id === effectId);
      if (fromIndex === -1) return s;
      const next = [...existing];
      const moved = next.splice(fromIndex, 1)[0];
      if (moved === undefined) return s;
      next.splice(toIndex, 0, moved);
      return {
        trackEffects: {
          ...s.trackEffects,
          [trackId]: next,
        },
      };
    });
  },

  getTrackEffects(trackId) {
    return get().trackEffects[trackId] ?? [];
  },
}));
