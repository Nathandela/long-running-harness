import { describe, it, expect } from "vitest";
import { computePeakAndRms, MeterState, updateMeterState } from "./metering";

describe("metering", () => {
  describe("computePeakAndRms", () => {
    it("returns 0 for silence", () => {
      const data = new Float32Array(128);
      const result = computePeakAndRms(data);
      expect(result.peak).toBe(0);
      expect(result.rms).toBe(0);
    });

    it("computes peak correctly", () => {
      const data = new Float32Array(128);
      data[50] = 0.8;
      data[51] = -0.9;
      const result = computePeakAndRms(data);
      expect(result.peak).toBeCloseTo(0.9);
    });

    it("computes RMS correctly for DC signal", () => {
      const data = new Float32Array(128).fill(0.5);
      const result = computePeakAndRms(data);
      expect(result.rms).toBeCloseTo(0.5, 2);
    });

    it("computes RMS correctly for sine wave", () => {
      const data = new Float32Array(1024);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin((2 * Math.PI * i) / data.length);
      }
      const result = computePeakAndRms(data);
      // RMS of sine = 1/sqrt(2) ~= 0.707
      expect(result.rms).toBeCloseTo(0.707, 1);
      expect(result.peak).toBeCloseTo(1.0, 1);
    });
  });

  describe("MeterState", () => {
    it("initializes with zero levels", () => {
      const state = new MeterState();
      expect(state.peak).toBe(0);
      expect(state.rms).toBe(0);
      expect(state.clipping).toBe(false);
    });

    it("latches clip indicator on clip", () => {
      const state = new MeterState();
      updateMeterState(state, 1.1, 0.8, 16);
      expect(state.clipping).toBe(true);
    });

    it("clip indicator stays latched", () => {
      const state = new MeterState();
      updateMeterState(state, 1.1, 0.8, 16);
      expect(state.clipping).toBe(true);
      // Even after level drops
      updateMeterState(state, 0.3, 0.2, 16);
      expect(state.clipping).toBe(true);
    });

    it("clip indicator can be cleared manually", () => {
      const state = new MeterState();
      updateMeterState(state, 1.1, 0.8, 16);
      expect(state.clipping).toBe(true);
      state.clearClip();
      expect(state.clipping).toBe(false);
    });
  });

  describe("emergency mute detection", () => {
    it("triggers after sustained clipping > 500ms", () => {
      const state = new MeterState();
      // Simulate 60fps, each frame ~16.67ms, so 500ms = ~30 frames
      let emergencyTriggered = false;
      for (let i = 0; i < 35; i++) {
        const result = updateMeterState(state, 1.1, 0.8, 16.67);
        if (result.emergencyMute) emergencyTriggered = true;
      }
      expect(emergencyTriggered).toBe(true);
    });

    it("does not trigger if clipping is brief", () => {
      const state = new MeterState();
      // Clip for only a few frames
      for (let i = 0; i < 5; i++) {
        updateMeterState(state, 1.1, 0.8, 16.67);
      }
      // Then drop below threshold
      const result = updateMeterState(state, 0.5, 0.3, 16.67);
      expect(result.emergencyMute).toBe(false);
    });
  });
});
