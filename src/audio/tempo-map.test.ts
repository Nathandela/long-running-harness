import { describe, it, expect } from "vitest";
import { createTempoMap } from "./tempo-map";

describe("createTempoMap", () => {
  const map120 = createTempoMap(120, { numerator: 4, denominator: 4 }, 44100);

  describe("secondsPerBeat", () => {
    it("returns 0.5s at 120 BPM", () => {
      expect(map120.secondsPerBeat()).toBe(0.5);
    });

    it("returns 1.0s at 60 BPM", () => {
      const map60 = createTempoMap(60, { numerator: 4, denominator: 4 }, 44100);
      expect(map60.secondsPerBeat()).toBe(1.0);
    });
  });

  describe("beatsToSeconds", () => {
    it("converts beats to seconds at 120 BPM", () => {
      expect(map120.beatsToSeconds(1)).toBe(0.5);
      expect(map120.beatsToSeconds(4)).toBe(2.0);
    });
  });

  describe("secondsToSamples / samplesToSeconds", () => {
    it("converts seconds to samples at 44100", () => {
      expect(map120.secondsToSamples(1.0)).toBe(44100);
      expect(map120.secondsToSamples(0.5)).toBe(22050);
    });

    it("converts samples to seconds at 44100", () => {
      expect(map120.samplesToSeconds(44100)).toBe(1.0);
    });

    it("round-trips samples", () => {
      const samples = map120.secondsToSamples(1.234);
      expect(map120.samplesToSeconds(samples)).toBeCloseTo(1.234, 6);
    });

    it("works at 48000 sample rate", () => {
      const map48k = createTempoMap(
        120,
        { numerator: 4, denominator: 4 },
        48000,
      );
      expect(map48k.secondsToSamples(1.0)).toBe(48000);
    });
  });

  describe("secondsToBBT", () => {
    it("returns bar 1, beat 1, tick 0 at time 0", () => {
      expect(map120.secondsToBBT(0)).toEqual({ bar: 1, beat: 1, tick: 0 });
    });

    it("returns bar 1, beat 2 at 0.5s (120 BPM)", () => {
      expect(map120.secondsToBBT(0.5)).toEqual({ bar: 1, beat: 2, tick: 0 });
    });

    it("returns bar 2, beat 1 at 2.0s (120 BPM, 4/4)", () => {
      expect(map120.secondsToBBT(2.0)).toEqual({ bar: 2, beat: 1, tick: 0 });
    });

    it("handles fractional beats as ticks", () => {
      // At 120 BPM, 0.25s = half a beat = 240 ticks (480 PPQ)
      expect(map120.secondsToBBT(0.25)).toEqual({ bar: 1, beat: 1, tick: 240 });
    });

    it("handles 3/4 time signature", () => {
      const map34 = createTempoMap(
        120,
        { numerator: 3, denominator: 4 },
        44100,
      );
      // 3 beats per bar at 0.5s each = 1.5s per bar
      // At 1.5s we should be at bar 2, beat 1
      expect(map34.secondsToBBT(1.5)).toEqual({ bar: 2, beat: 1, tick: 0 });
      // At 1.0s we should be at bar 1, beat 3 (0-indexed beat 2)
      expect(map34.secondsToBBT(1.0)).toEqual({ bar: 1, beat: 3, tick: 0 });
    });
  });

  describe("bbtToSeconds", () => {
    it("returns 0 for bar 1, beat 1, tick 0", () => {
      expect(map120.bbtToSeconds({ bar: 1, beat: 1, tick: 0 })).toBe(0);
    });

    it("returns 0.5s for bar 1, beat 2 at 120 BPM", () => {
      expect(map120.bbtToSeconds({ bar: 1, beat: 2, tick: 0 })).toBe(0.5);
    });

    it("returns 2.0s for bar 2, beat 1 at 120 BPM 4/4", () => {
      expect(map120.bbtToSeconds({ bar: 2, beat: 1, tick: 0 })).toBe(2.0);
    });

    it("handles ticks", () => {
      // 240 ticks = half a beat = 0.25s at 120 BPM
      expect(map120.bbtToSeconds({ bar: 1, beat: 1, tick: 240 })).toBeCloseTo(
        0.25,
        10,
      );
    });
  });

  describe("round-trip conversion", () => {
    it("seconds -> BBT -> seconds is identity", () => {
      const testValues = [0, 0.25, 0.5, 1.0, 2.0, 3.75, 10.0];
      for (const seconds of testValues) {
        const bbt = map120.secondsToBBT(seconds);
        const result = map120.bbtToSeconds(bbt);
        expect(result).toBeCloseTo(seconds, 6);
      }
    });
  });

  describe("readonly properties", () => {
    it("exposes bpm, timeSignature, sampleRate", () => {
      expect(map120.bpm).toBe(120);
      expect(map120.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      expect(map120.sampleRate).toBe(44100);
    });
  });
});
