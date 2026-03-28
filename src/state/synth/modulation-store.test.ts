import { describe, it, expect, beforeEach } from "vitest";
import { useModulationStore } from "./modulation-store";
import type { ModSource, ModDestination } from "@audio/synth/modulation-types";

describe("ModulationStore", () => {
  beforeEach(() => {
    useModulationStore.setState({ matrices: {} });
  });

  it("initializes an empty matrix for a track", () => {
    useModulationStore.getState().initMatrix("track-1");
    const matrix = useModulationStore.getState().matrices["track-1"];
    expect(matrix).toBeDefined();
    expect(matrix?.routes).toEqual([]);
  });

  it("does not overwrite existing matrix", () => {
    const { initMatrix, addRoute } = useModulationStore.getState();
    initMatrix("track-1");
    addRoute("track-1", "lfo1", "filterCutoff", 0.5);
    initMatrix("track-1"); // re-init should not reset
    expect(
      useModulationStore.getState().matrices["track-1"]?.routes,
    ).toHaveLength(1);
  });

  it("removes a matrix for a track", () => {
    const { initMatrix, removeMatrix } = useModulationStore.getState();
    initMatrix("track-1");
    removeMatrix("track-1");
    expect(useModulationStore.getState().matrices["track-1"]).toBeUndefined();
  });

  describe("addRoute", () => {
    it("adds a route to the matrix", () => {
      const { initMatrix, addRoute } = useModulationStore.getState();
      initMatrix("track-1");
      addRoute("track-1", "lfo1", "filterCutoff", 0.75);
      const routes = useModulationStore.getState().matrices["track-1"]?.routes;
      expect(routes).toHaveLength(1);
      expect(routes?.[0]?.source).toBe("lfo1");
      expect(routes?.[0]?.destination).toBe("filterCutoff");
      expect(routes?.[0]?.amount).toBe(0.75);
      expect(routes?.[0]?.bipolar).toBe(true);
    });

    it("adds a unipolar route", () => {
      const { initMatrix, addRoute } = useModulationStore.getState();
      initMatrix("track-1");
      addRoute("track-1", "velocity", "ampLevel", 0.5, false);
      const route =
        useModulationStore.getState().matrices["track-1"]?.routes[0];
      expect(route?.bipolar).toBe(false);
    });

    it("does nothing if matrix not initialized", () => {
      useModulationStore
        .getState()
        .addRoute("track-1", "lfo1", "filterCutoff", 0.5);
      expect(useModulationStore.getState().matrices["track-1"]).toBeUndefined();
    });

    it("enforces max routes limit (32)", () => {
      const { initMatrix, addRoute } = useModulationStore.getState();
      initMatrix("track-1");
      const sources: ModSource[] = ["lfo1", "lfo2", "ampEnv", "filterEnv"];
      const dests: ModDestination[] = [
        "osc1Pitch",
        "osc2Pitch",
        "oscMix",
        "filterCutoff",
        "filterResonance",
        "ampLevel",
        "lfo1Rate",
        "lfo2Rate",
      ];
      for (let i = 0; i < 32; i++) {
        const src = sources[i % 4] ?? "lfo1";
        const dst = dests[i % 8] ?? "filterCutoff";
        addRoute("track-1", src, dst, i / 32);
      }
      expect(
        useModulationStore.getState().matrices["track-1"]?.routes,
      ).toHaveLength(32);
      // 33rd should not be added
      addRoute("track-1", "lfo1", "filterCutoff", 1);
      expect(
        useModulationStore.getState().matrices["track-1"]?.routes,
      ).toHaveLength(32);
    });
  });

  describe("removeRoute", () => {
    it("removes a route by id", () => {
      const { initMatrix, addRoute, removeRoute } =
        useModulationStore.getState();
      initMatrix("track-1");
      addRoute("track-1", "lfo1", "filterCutoff", 0.5);
      const id =
        useModulationStore.getState().matrices["track-1"]?.routes[0]?.id ?? "";
      expect(id).not.toBe("");
      removeRoute("track-1", id);
      expect(
        useModulationStore.getState().matrices["track-1"]?.routes,
      ).toHaveLength(0);
    });
  });

  describe("updateRouteAmount", () => {
    it("updates the amount of an existing route", () => {
      const { initMatrix, addRoute, updateRouteAmount } =
        useModulationStore.getState();
      initMatrix("track-1");
      addRoute("track-1", "lfo1", "filterCutoff", 0.5);
      const id =
        useModulationStore.getState().matrices["track-1"]?.routes[0]?.id ?? "";
      updateRouteAmount("track-1", id, 0.9);
      expect(
        useModulationStore.getState().matrices["track-1"]?.routes[0]?.amount,
      ).toBe(0.9);
    });

    it("clamps amount to [-1, 1]", () => {
      const { initMatrix, addRoute, updateRouteAmount } =
        useModulationStore.getState();
      initMatrix("track-1");
      addRoute("track-1", "lfo1", "filterCutoff", 0.5);
      const id =
        useModulationStore.getState().matrices["track-1"]?.routes[0]?.id ?? "";
      updateRouteAmount("track-1", id, 2.0);
      expect(
        useModulationStore.getState().matrices["track-1"]?.routes[0]?.amount,
      ).toBe(1);
    });
  });

  describe("getRoutes", () => {
    it("returns empty array for uninitialized track", () => {
      expect(useModulationStore.getState().getRoutes("track-1")).toEqual([]);
    });

    it("returns routes for initialized track", () => {
      const { initMatrix, addRoute, getRoutes } = useModulationStore.getState();
      initMatrix("track-1");
      addRoute("track-1", "lfo1", "filterCutoff", 0.5);
      expect(getRoutes("track-1")).toHaveLength(1);
    });
  });

  describe("getWorkletRoutes", () => {
    it("converts routes to worklet format", () => {
      const { initMatrix, addRoute, getWorkletRoutes } =
        useModulationStore.getState();
      initMatrix("track-1");
      addRoute("track-1", "lfo1", "filterCutoff", 0.5);
      const workletRoutes = getWorkletRoutes("track-1");
      expect(workletRoutes).toHaveLength(1);
      expect(workletRoutes[0]).toEqual({
        sourceIdx: 0, // lfo1
        destIdx: 3, // filterCutoff
        amount: 0.5,
        bipolar: true,
      });
    });
  });
});
