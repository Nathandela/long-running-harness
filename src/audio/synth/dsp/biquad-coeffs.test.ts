import { describe, it, expect } from "vitest";
import {
  computeBiquadCoeffs,
  createBiquadCoeffs,
  createBiquadFilter,
  type FilterType,
} from "./biquad-coeffs";

const SR = 48000;

/**
 * Measure the magnitude response of the filter at a given frequency.
 * Runs a sine wave through the filter and measures output amplitude.
 */
function measureResponse(
  filterType: FilterType,
  cutoff: number,
  q: number,
  testFreq: number,
  numCycles = 20,
): number {
  const filter = createBiquadFilter(filterType);
  computeBiquadCoeffs(filterType, cutoff, q, SR, filter.coeffs);

  const samplesPerCycle = SR / testFreq;
  const numSamples = Math.floor(samplesPerCycle * numCycles);

  // Run filter to settle transients
  for (let i = 0; i < numSamples; i++) {
    const input = Math.sin((2 * Math.PI * testFreq * i) / SR);
    filter.process(input);
  }

  // Measure output amplitude over one cycle
  let maxOutput = 0;
  for (let i = 0; i < Math.floor(samplesPerCycle * 2); i++) {
    const input = Math.sin((2 * Math.PI * testFreq * (numSamples + i)) / SR);
    const output = Math.abs(filter.process(input));
    if (output > maxOutput) maxOutput = output;
  }

  return maxOutput;
}

describe("Biquad Filter Coefficients", () => {
  it("lowpass: passes low frequencies, attenuates high", () => {
    const cutoff = 1000;
    const q = 0.707;

    const lowResponse = measureResponse("lowpass", cutoff, q, 100);
    const highResponse = measureResponse("lowpass", cutoff, q, 10000);

    expect(lowResponse).toBeGreaterThan(0.7);
    expect(highResponse).toBeLessThan(lowResponse * 0.3);
  });

  it("highpass: passes high frequencies, attenuates low", () => {
    const cutoff = 1000;
    const q = 0.707;

    const lowResponse = measureResponse("highpass", cutoff, q, 100);
    const highResponse = measureResponse("highpass", cutoff, q, 10000);

    expect(highResponse).toBeGreaterThan(0.7);
    expect(lowResponse).toBeLessThan(highResponse * 0.3);
  });

  it("bandpass: passes center frequency, attenuates edges", () => {
    const cutoff = 2000;
    const q = 2;

    const centerResponse = measureResponse("bandpass", cutoff, q, 2000);
    const lowResponse = measureResponse("bandpass", cutoff, q, 200);
    const highResponse = measureResponse("bandpass", cutoff, q, 15000);

    expect(centerResponse).toBeGreaterThan(lowResponse);
    expect(centerResponse).toBeGreaterThan(highResponse);
  });

  it("coefficients are finite for edge cases", () => {
    const out = createBiquadCoeffs();

    computeBiquadCoeffs("lowpass", 20, 0.707, SR, out);
    expect(Number.isFinite(out.b0)).toBe(true);
    expect(Number.isFinite(out.a0)).toBe(true);

    computeBiquadCoeffs("lowpass", 23000, 0.707, SR, out);
    expect(Number.isFinite(out.b0)).toBe(true);
    expect(Number.isFinite(out.a0)).toBe(true);

    computeBiquadCoeffs("lowpass", 1000, 0.1, SR, out);
    expect(Number.isFinite(out.b0)).toBe(true);

    computeBiquadCoeffs("lowpass", 1000, 20, SR, out);
    expect(Number.isFinite(out.b0)).toBe(true);
  });

  it("filter reset clears delay line", () => {
    const filter = createBiquadFilter("lowpass");
    computeBiquadCoeffs("lowpass", 1000, 0.707, SR, filter.coeffs);

    for (let i = 0; i < 100; i++) {
      filter.process(Math.sin((2 * Math.PI * 440 * i) / SR));
    }

    filter.reset();

    const output = filter.process(0);
    expect(output).toBe(0);
  });

  it("filter output values are finite", () => {
    const filter = createBiquadFilter("lowpass");
    computeBiquadCoeffs("lowpass", 5000, 5, SR, filter.coeffs);

    for (let i = 0; i < 10000; i++) {
      const input = Math.sin((2 * Math.PI * 440 * i) / SR);
      const output = filter.process(input);
      expect(Number.isFinite(output)).toBe(true);
    }
  });
});
