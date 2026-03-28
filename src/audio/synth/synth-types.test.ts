import { describe, it, expect } from "vitest";
import {
  midiToFreq,
  DEFAULT_SYNTH_PARAMS,
  WAVEFORM_TYPES,
  FILTER_TYPES,
  LFO_SHAPES,
} from "./synth-types";

describe("Synth Types", () => {
  describe("midiToFreq", () => {
    it("A4 (69) = 440Hz", () => {
      expect(midiToFreq(69)).toBeCloseTo(440, 2);
    });

    it("A3 (57) = 220Hz", () => {
      expect(midiToFreq(57)).toBeCloseTo(220, 2);
    });

    it("A5 (81) = 880Hz", () => {
      expect(midiToFreq(81)).toBeCloseTo(880, 2);
    });

    it("C4 (60) = ~261.63Hz", () => {
      expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
    });

    it("MIDI 0 produces a valid low frequency", () => {
      const freq = midiToFreq(0);
      expect(freq).toBeGreaterThan(0);
      expect(freq).toBeLessThan(20);
    });

    it("MIDI 127 produces a valid high frequency", () => {
      const freq = midiToFreq(127);
      expect(freq).toBeGreaterThan(10000);
      expect(Number.isFinite(freq)).toBe(true);
    });
  });

  describe("DEFAULT_SYNTH_PARAMS", () => {
    it("has valid oscillator types", () => {
      expect(WAVEFORM_TYPES).toContain(DEFAULT_SYNTH_PARAMS.osc1Type);
      expect(WAVEFORM_TYPES).toContain(DEFAULT_SYNTH_PARAMS.osc2Type);
    });

    it("has valid filter type", () => {
      expect(FILTER_TYPES).toContain(DEFAULT_SYNTH_PARAMS.filterType);
    });

    it("has valid LFO shapes", () => {
      expect(LFO_SHAPES).toContain(DEFAULT_SYNTH_PARAMS.lfo1Shape);
      expect(LFO_SHAPES).toContain(DEFAULT_SYNTH_PARAMS.lfo2Shape);
    });

    it("envelope times are non-negative", () => {
      expect(DEFAULT_SYNTH_PARAMS.ampAttack).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SYNTH_PARAMS.ampDecay).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SYNTH_PARAMS.ampSustain).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SYNTH_PARAMS.ampSustain).toBeLessThanOrEqual(1);
      expect(DEFAULT_SYNTH_PARAMS.ampRelease).toBeGreaterThanOrEqual(0);
    });

    it("filter cutoff is in audible range", () => {
      expect(DEFAULT_SYNTH_PARAMS.filterCutoff).toBeGreaterThanOrEqual(20);
      expect(DEFAULT_SYNTH_PARAMS.filterCutoff).toBeLessThanOrEqual(20000);
    });

    it("master gain is in valid range", () => {
      expect(DEFAULT_SYNTH_PARAMS.masterGain).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SYNTH_PARAMS.masterGain).toBeLessThanOrEqual(1);
    });
  });

  describe("Type lookup arrays", () => {
    it("WAVEFORM_TYPES has 4 entries", () => {
      expect(WAVEFORM_TYPES.length).toBe(4);
    });

    it("FILTER_TYPES has 3 entries", () => {
      expect(FILTER_TYPES.length).toBe(3);
    });

    it("LFO_SHAPES has 4 entries", () => {
      expect(LFO_SHAPES.length).toBe(4);
    });
  });
});
