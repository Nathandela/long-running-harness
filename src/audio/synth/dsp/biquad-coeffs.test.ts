import { describe, it, expect } from "vitest";
import {
  computeBiquadCoeffs,
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
  const coeffs = computeBiquadCoeffs(filterType, cutoff, q, SR);

  const samplesPerCycle = SR / testFreq;
  const numSamples = Math.floor(samplesPerCycle * numCycles);

  // Run filter to settle transients
  for (let i = 0; i < numSamples; i++) {
    const input = Math.sin((2 * Math.PI * testFreq * i) / SR);
    filter.process(input, coeffs);
  }

  // Measure output amplitude over one cycle
  let maxOutput = 0;
  for (let i = 0; i < Math.floor(samplesPerCycle * 2); i++) {
    const input = Math.sin((2 * Math.PI * testFreq * (numSamples + i)) / SR);
    const output = Math.abs(filter.process(input, coeffs));
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

    // Low freq should pass through (~1.0)
    expect(lowResponse).toBeGreaterThan(0.7);
    // High freq should be attenuated
    expect(highResponse).toBeLessThan(lowResponse * 0.3);
  });

  it("highpass: passes high frequencies, attenuates low", () => {
    const cutoff = 1000;
    const q = 0.707;

    const lowResponse = measureResponse("highpass", cutoff, q, 100);
    const highResponse = measureResponse("highpass", cutoff, q, 10000);

    // High freq should pass through
    expect(highResponse).toBeGreaterThan(0.7);
    // Low freq should be attenuated
    expect(lowResponse).toBeLessThan(highResponse * 0.3);
  });

  it("bandpass: passes center frequency, attenuates edges", () => {
    const cutoff = 2000;
    const q = 2;

    const centerResponse = measureResponse("bandpass", cutoff, q, 2000);
    const lowResponse = measureResponse("bandpass", cutoff, q, 200);
    const highResponse = measureResponse("bandpass", cutoff, q, 15000);

    // Center should be the strongest
    expect(centerResponse).toBeGreaterThan(lowResponse);
    expect(centerResponse).toBeGreaterThan(highResponse);
  });

  it("coefficients are finite for edge cases", () => {
    // Very low cutoff
    const low = computeBiquadCoeffs("lowpass", 20, 0.707, SR);
    expect(Number.isFinite(low.b0)).toBe(true);
    expect(Number.isFinite(low.a0)).toBe(true);

    // Near Nyquist
    const high = computeBiquadCoeffs("lowpass", 23000, 0.707, SR);
    expect(Number.isFinite(high.b0)).toBe(true);
    expect(Number.isFinite(high.a0)).toBe(true);

    // Very low Q
    const lowQ = computeBiquadCoeffs("lowpass", 1000, 0.1, SR);
    expect(Number.isFinite(lowQ.b0)).toBe(true);

    // Very high Q
    const highQ = computeBiquadCoeffs("lowpass", 1000, 20, SR);
    expect(Number.isFinite(highQ.b0)).toBe(true);
  });

  it("filter reset clears delay line", () => {
    const filter = createBiquadFilter("lowpass");
    const coeffs = computeBiquadCoeffs("lowpass", 1000, 0.707, SR);

    // Run some samples
    for (let i = 0; i < 100; i++) {
      filter.process(Math.sin((2 * Math.PI * 440 * i) / SR), coeffs);
    }

    filter.reset();

    // After reset, processing zero input should give zero output
    const output = filter.process(0, coeffs);
    expect(output).toBe(0);
  });

  it("filter output values are finite", () => {
    const filter = createBiquadFilter("lowpass");
    const coeffs = computeBiquadCoeffs("lowpass", 5000, 5, SR);

    for (let i = 0; i < 10000; i++) {
      const input = Math.sin((2 * Math.PI * 440 * i) / SR);
      const output = filter.process(input, coeffs);
      expect(Number.isFinite(output)).toBe(true);
    }
  });
});
