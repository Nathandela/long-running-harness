/**
 * Bridge between routing Zustand store and the RoutingEngine.
 * Subscribes to store changes, creates/disposes buses, sends, sidechains,
 * and wires pre/post-fader sends to the correct channel strip tap point.
 */

import type { RoutingEngine, SendRoute } from "./routing";
import type { MixerEngine } from "./types";
import { useRoutingStore } from "@state/routing/routing-store";

export type RoutingBridge = {
  dispose(): void;
};

export function createRoutingBridge(
  routing: RoutingEngine,
  mixer: MixerEngine,
): RoutingBridge {
  // Track which sends are wired so we can re-wire on preFader toggle
  const wiredSends = new Map<string, { send: SendRoute; preFader: boolean }>();
  const knownBuses = new Set<string>();
  const knownSidechains = new Set<string>();

  function sendKey(trackId: string, busId: string): string {
    return `${trackId}:${busId}`;
  }

  function scKey(sourceId: string, targetId: string): string {
    return `${sourceId}:${targetId}`;
  }

  function wireSend(trackId: string, send: SendRoute, preFader: boolean): void {
    const strip = mixer.getStrip(trackId) ?? mixer.getOrCreateStrip(trackId);
    const tap = preFader ? strip.preFaderTap : strip.faderGain;
    tap.connect(send.sendGain);
    wiredSends.set(sendKey(trackId, send.busId), { send, preFader });
  }

  function unwireSend(trackId: string, busId: string): void {
    const key = sendKey(trackId, busId);
    const wired = wiredSends.get(key);
    if (!wired) return;

    const strip = mixer.getStrip(trackId);
    if (strip) {
      const tap = wired.preFader ? strip.preFaderTap : strip.faderGain;
      try {
        tap.disconnect(wired.send.sendGain);
      } catch {
        // Already disconnected
      }
    }
    wiredSends.delete(key);
  }

  function sync(): void {
    const state = useRoutingStore.getState();

    // Sync buses: add new, remove stale
    const storeBusIds = new Set(Object.keys(state.buses));
    for (const id of knownBuses) {
      if (!storeBusIds.has(id)) {
        routing.removeBus(id);
        knownBuses.delete(id);
      }
    }
    for (const [id, bus] of Object.entries(state.buses)) {
      if (!knownBuses.has(id)) {
        routing.createBus(id);
        knownBuses.add(id);
      }
      // Sync output target
      const engineBus = routing.getBus(id);
      if (engineBus && engineBus.outputTarget !== bus.outputTarget) {
        try {
          routing.setBusOutput(id, bus.outputTarget);
        } catch {
          // Cycle or invalid target -- store is out of sync, skip
        }
      }
    }

    // Sync sends
    const activeSendKeys = new Set<string>();
    for (const [trackId, trackSends] of Object.entries(state.sends)) {
      for (const sendState of trackSends) {
        const key = sendKey(trackId, sendState.busId);
        activeSendKeys.add(key);

        const wired = wiredSends.get(key);
        if (wired) {
          // Update level
          if (wired.send.level !== sendState.level) {
            routing.setSendLevel(trackId, sendState.busId, sendState.level);
          }
          // Re-wire if preFader changed
          if (wired.preFader !== sendState.preFader) {
            unwireSend(trackId, sendState.busId);
            wireSend(trackId, wired.send, sendState.preFader);
          }
        } else {
          // New send
          try {
            const send = routing.addSend(trackId, sendState.busId, {
              level: sendState.level,
              preFader: sendState.preFader,
            });
            wireSend(trackId, send, sendState.preFader);
          } catch {
            // Bus not found or cycle -- skip
          }
        }
      }
    }

    // Remove stale sends
    for (const key of [...wiredSends.keys()]) {
      if (!activeSendKeys.has(key)) {
        const [trackId, busId] = key.split(":");
        if (trackId !== undefined && busId !== undefined) {
          unwireSend(trackId, busId);
          routing.removeSend(trackId, busId);
        }
      }
    }

    // Sync sidechains
    const activeScKeys = new Set<string>();
    for (const sc of state.sidechains) {
      const key = scKey(sc.sourceId, sc.targetId);
      activeScKeys.add(key);
      if (!knownSidechains.has(key)) {
        routing.addSidechain(sc.sourceId, sc.targetId);
        knownSidechains.add(key);
      }
    }
    for (const key of [...knownSidechains]) {
      if (!activeScKeys.has(key)) {
        const [sourceId, targetId] = key.split(":");
        if (sourceId !== undefined && targetId !== undefined) {
          routing.removeSidechain(sourceId, targetId);
        }
        knownSidechains.delete(key);
      }
    }
  }

  // Initial sync
  sync();

  // Subscribe to store changes
  const unsub = useRoutingStore.subscribe(sync);

  return {
    dispose(): void {
      unsub();
      for (const key of [...wiredSends.keys()]) {
        const [trackId, busId] = key.split(":");
        if (trackId !== undefined && busId !== undefined) {
          unwireSend(trackId, busId);
        }
      }
    },
  };
}
