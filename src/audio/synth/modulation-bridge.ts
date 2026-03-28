/**
 * Bridge between the modulation Zustand store and the synth AudioWorklet.
 * Subscribes to store changes and forwards WorkletModRoute[] to the instrument.
 *
 * Usage: call `subscribeModRoutes(trackId, instrument)` when an instrument
 * is created for a track. Returns an unsubscribe function for cleanup.
 */

import { useModulationStore } from "@state/synth/modulation-store";
import type { SynthInstrument } from "./synth-instrument";

/**
 * Subscribe a SynthInstrument to modulation store changes for the given track.
 * Immediately sends current routes, then forwards any future changes.
 * Returns an unsubscribe function.
 */
export function subscribeModRoutes(
  trackId: string,
  instrument: SynthInstrument,
): () => void {
  // Send current routes immediately
  const currentRoutes = useModulationStore.getState().getWorkletRoutes(trackId);
  instrument.setModRoutes(currentRoutes);

  // Subscribe to future changes
  let prevJson = JSON.stringify(currentRoutes);

  return useModulationStore.subscribe((state) => {
    const routes = state.getWorkletRoutes(trackId);
    const json = JSON.stringify(routes);
    // Only send when routes actually changed (avoid redundant messages)
    if (json !== prevJson) {
      prevJson = json;
      instrument.setModRoutes(routes);
    }
  });
}
