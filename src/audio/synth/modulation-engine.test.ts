import { describe, it, expect } from "vitest";
import {
  createModAccumulators,
  applyModRoute,
  resetAccumulators,
  SOURCE_INDEX,
  DEST_INDEX,
} from "./modulation-engine";

describe("Modulation Engine", () => {
  describe("createModAccumulators", () => {
    it("creates accumulators with all destinations zeroed", () => {
      const acc = createModAccumulators();
      expect(acc.osc1Pitch).toBe(0);
      expect(acc.osc2Pitch).toBe(0);
      expect(acc.oscMix).toBe(0);
      expect(acc.filterCutoff).toBe(0);
      expect(acc.filterResonance).toBe(0);
      expect(acc.ampLevel).toBe(0);
      expect(acc.lfo1Rate).toBe(0);
      expect(acc.lfo2Rate).toBe(0);
    });
  });

  describe("resetAccumulators", () => {
    it("resets all values to zero", () => {
      const acc = createModAccumulators();
      acc.osc1Pitch = 5;
      acc.filterCutoff = 12;
      acc.ampLevel = 0.3;
      resetAccumulators(acc);
      expect(acc.osc1Pitch).toBe(0);
      expect(acc.filterCutoff).toBe(0);
      expect(acc.ampLevel).toBe(0);
    });
  });

  describe("applyModRoute", () => {
    it("accumulates source * amount to destination (bipolar source)", () => {
      const acc = createModAccumulators();
      // Route: LFO1 (index 0) -> filterCutoff (dest index 3), amount=0.5, bipolar
      // Source value = 0.8 (LFO output)
      const sourceValues = new Float64Array(8);
      sourceValues[SOURCE_INDEX.lfo1] = 0.8;

      applyModRoute(
        acc,
        sourceValues,
        SOURCE_INDEX.lfo1, // source index
        DEST_INDEX.filterCutoff, // dest index
        0.5, // amount
        true, // bipolar
      );

      // bipolar: value * amount = 0.8 * 0.5 = 0.4
      expect(acc.filterCutoff).toBeCloseTo(0.4);
    });

    it("accumulates unipolar source (maps [-1,1] to [0,1])", () => {
      const acc = createModAccumulators();
      const sourceValues = new Float64Array(8);
      sourceValues[SOURCE_INDEX.lfo1] = -0.5; // LFO at -0.5

      applyModRoute(
        acc,
        sourceValues,
        SOURCE_INDEX.lfo1,
        DEST_INDEX.ampLevel,
        1.0,
        false, // unipolar
      );

      // unipolar: (value + 1) / 2 * amount = (-0.5 + 1) / 2 * 1.0 = 0.25
      expect(acc.ampLevel).toBeCloseTo(0.25);
    });

    it("accumulates multiple routes to same destination", () => {
      const acc = createModAccumulators();
      const sourceValues = new Float64Array(8);
      sourceValues[SOURCE_INDEX.lfo1] = 1.0;
      sourceValues[SOURCE_INDEX.velocity] = 0.8;

      applyModRoute(
        acc,
        sourceValues,
        SOURCE_INDEX.lfo1,
        DEST_INDEX.filterCutoff,
        0.5,
        true,
      );
      applyModRoute(
        acc,
        sourceValues,
        SOURCE_INDEX.velocity,
        DEST_INDEX.filterCutoff,
        0.3,
        true,
      );

      // 1.0 * 0.5 + 0.8 * 0.3 = 0.5 + 0.24 = 0.74
      expect(acc.filterCutoff).toBeCloseTo(0.74);
    });

    it("handles negative amounts (inverted modulation)", () => {
      const acc = createModAccumulators();
      const sourceValues = new Float64Array(8);
      sourceValues[SOURCE_INDEX.lfo1] = 1.0;

      applyModRoute(
        acc,
        sourceValues,
        SOURCE_INDEX.lfo1,
        DEST_INDEX.osc1Pitch,
        -0.5,
        true,
      );

      expect(acc.osc1Pitch).toBeCloseTo(-0.5);
    });

    it("handles zero amount (no modulation)", () => {
      const acc = createModAccumulators();
      const sourceValues = new Float64Array(8);
      sourceValues[SOURCE_INDEX.lfo1] = 1.0;

      applyModRoute(
        acc,
        sourceValues,
        SOURCE_INDEX.lfo1,
        DEST_INDEX.osc1Pitch,
        0,
        true,
      );

      expect(acc.osc1Pitch).toBe(0);
    });
  });

  describe("SOURCE_INDEX", () => {
    it("maps all 8 sources to unique indices", () => {
      const indices = new Set(Object.values(SOURCE_INDEX));
      expect(indices.size).toBe(8);
    });
  });

  describe("DEST_INDEX", () => {
    it("maps all 8 destinations to unique indices", () => {
      const indices = new Set(Object.values(DEST_INDEX));
      expect(indices.size).toBe(8);
    });
  });
});
