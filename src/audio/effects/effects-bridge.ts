/**
 * Bridge between effects Zustand store and Web Audio instances.
 * Subscribes to store changes, creates/disposes EffectInstances,
 * and wires them into the MixerEngine's insert chains.
 */

import type { EffectInstance, EffectRegistry } from "./types";
import type { MixerEngine } from "@audio/mixer";
import { useEffectsStore } from "@state/effects";
import type { EffectSlotState } from "@state/effects";

export type EffectsBridge = {
  /** Get a live audio instance by effect ID */
  getInstance(effectId: string): EffectInstance | undefined;
  /** Tear down all instances and unsubscribe */
  dispose(): void;
};

export function createEffectsBridge(
  ctx: AudioContext,
  registry: EffectRegistry,
  mixer: MixerEngine,
): EffectsBridge {
  const instances = new Map<string, EffectInstance>();
  const effectTrackMap = new Map<string, string>();

  function initInstance(
    trackId: string,
    slot: EffectSlotState,
  ): EffectInstance {
    const instance = registry.create(slot.typeId, ctx, slot.id);
    instances.set(slot.id, instance);
    effectTrackMap.set(slot.id, trackId);

    for (const [key, value] of Object.entries(slot.params)) {
      instance.setParam(key, value);
    }
    instance.setBypassed(slot.bypassed);
    return instance;
  }

  function syncSlot(trackId: string, slot: EffectSlotState): void {
    const existing = instances.get(slot.id);
    if (existing) {
      if (existing.typeId !== slot.typeId) {
        // Type swap: dispose old, create new, replace in-place to keep order
        existing.dispose();
        instances.delete(slot.id);
        const instance = initInstance(trackId, slot);
        mixer.replaceInsert(trackId, slot.id, instance.input, instance.output);
        return;
      }

      // Sync params
      for (const [key, value] of Object.entries(slot.params)) {
        if (existing.getParam(key) !== value) {
          existing.setParam(key, value);
        }
      }
      // Sync bypass
      if (existing.bypassed !== slot.bypassed) {
        existing.setBypassed(slot.bypassed);
      }
      return;
    }

    // Create new instance
    const instance = initInstance(trackId, slot);
    mixer.getOrCreateStrip(trackId);
    mixer.addInsert(trackId, slot.id, instance.input, instance.output);
  }

  function removeInstance(effectId: string): void {
    const instance = instances.get(effectId);
    if (!instance) return;

    const trackId = effectTrackMap.get(effectId);
    if (trackId !== undefined && trackId !== "") {
      mixer.removeInsert(trackId, effectId);
    }

    instance.dispose();
    instances.delete(effectId);
    effectTrackMap.delete(effectId);
  }

  function sync(): void {
    const state = useEffectsStore.getState();
    const activeIds = new Set<string>();

    for (const [trackId, slots] of Object.entries(state.trackEffects)) {
      for (const slot of slots) {
        activeIds.add(slot.id);
        syncSlot(trackId, slot);
      }
    }

    // Remove instances no longer in store
    for (const id of [...instances.keys()]) {
      if (!activeIds.has(id)) {
        removeInstance(id);
      }
    }
  }

  // Initial sync
  sync();

  // Subscribe to store changes, only sync when trackEffects changes
  let prevTrackEffects = useEffectsStore.getState().trackEffects;
  const unsub = useEffectsStore.subscribe((state) => {
    if (state.trackEffects !== prevTrackEffects) {
      prevTrackEffects = state.trackEffects;
      sync();
    }
  });

  return {
    getInstance(effectId) {
      return instances.get(effectId);
    },
    dispose() {
      unsub();
      for (const id of [...instances.keys()]) {
        removeInstance(id);
      }
    },
  };
}
