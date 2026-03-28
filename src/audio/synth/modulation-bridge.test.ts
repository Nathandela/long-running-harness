import { describe, it, expect, beforeEach, vi } from "vitest";
import { subscribeModRoutes } from "./modulation-bridge";
import { useModulationStore } from "@state/synth/modulation-store";
import type { SynthInstrument } from "./synth-instrument";
import type { WorkletModRoute } from "./modulation-engine";

function createMockInstrument(): {
  instrument: SynthInstrument;
  setModRoutesSpy: ReturnType<typeof vi.fn>;
  getLastRoutes: () => WorkletModRoute[];
} {
  let lastRoutes: WorkletModRoute[] = [];
  const setModRoutesSpy = vi.fn((routes: WorkletModRoute[]) => {
    lastRoutes = routes;
  });
  const instrument: SynthInstrument = {
    output: {} as AudioNode,
    params: {} as SynthInstrument["params"],
    noteOn: vi.fn(),
    noteOff: vi.fn(),
    allNotesOff: vi.fn(),
    setParam: vi.fn(),
    setModRoutes: setModRoutesSpy,
    setModSource: vi.fn(),
    connectToMixer: vi.fn(),
    disconnectFromMixer: vi.fn(),
    dispose: vi.fn(),
  };
  return { instrument, setModRoutesSpy, getLastRoutes: () => lastRoutes };
}

describe("subscribeModRoutes", () => {
  const trackId = "track-1";

  beforeEach(() => {
    useModulationStore.setState({ matrices: {} });
    useModulationStore.getState().initMatrix(trackId);
  });

  it("sends current routes immediately on subscribe", () => {
    useModulationStore
      .getState()
      .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
    const { instrument, setModRoutesSpy, getLastRoutes } =
      createMockInstrument();

    subscribeModRoutes(trackId, instrument);

    expect(setModRoutesSpy).toHaveBeenCalledTimes(1);
    expect(getLastRoutes()).toHaveLength(1);
    expect(getLastRoutes()[0]?.amount).toBe(0.5);
  });

  it("forwards route changes to instrument", () => {
    const { instrument, setModRoutesSpy, getLastRoutes } =
      createMockInstrument();
    subscribeModRoutes(trackId, instrument);

    // Initial empty routes call
    expect(setModRoutesSpy).toHaveBeenCalledTimes(1);

    // Add a route
    useModulationStore.getState().addRoute(trackId, "lfo2", "osc1Pitch", 0.75);

    expect(setModRoutesSpy).toHaveBeenCalledTimes(2);
    expect(getLastRoutes()).toHaveLength(1);
  });

  it("stops forwarding after unsubscribe", () => {
    const { instrument, setModRoutesSpy } = createMockInstrument();
    const unsub = subscribeModRoutes(trackId, instrument);

    unsub();

    useModulationStore
      .getState()
      .addRoute(trackId, "lfo1", "filterCutoff", 0.5);

    // Only the initial call, no update after unsubscribe
    expect(setModRoutesSpy).toHaveBeenCalledTimes(1);
  });
});
