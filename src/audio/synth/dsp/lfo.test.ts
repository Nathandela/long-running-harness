import { describe, it, expect } from "vitest";
import { createLFO, type LFOShape } from "./lfo";

const SR = 48000;

/** Generate N samples from the LFO at the given rate */
function generateLFO(
  shape: LFOShape,
  rate: number,
  numSamples: number,
): Float64Array {
  const lfo = createLFO(shape);
  const out = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    out[i] = lfo.process(rate, SR);
  }
  return out;
}

describe("LFO", () => {
  it("sine output stays within [-1, 1]", () => {
    const samples = generateLFO("sine", 5, SR);
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-1.001);
      expect(samples[i]).toBeLessThanOrEqual(1.001);
    }
  });

  it("square output is +1 or -1", () => {
    const samples = generateLFO("square", 2, SR);
    for (let i = 0; i < samples.length; i++) {
      expect(Math.abs(samples[i] ?? 0)).toBeCloseTo(1, 0);
    }
  });

  it("triangle output stays within [-1, 1]", () => {
    const samples = generateLFO("triangle", 3, SR);
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-1.001);
      expect(samples[i]).toBeLessThanOrEqual(1.001);
    }
  });

  it("sample-and-hold changes value once per cycle", () => {
    const lfo = createLFO("sample-and-hold");
    const rate = 2; // 2 Hz

    // Half a cycle - value should be constant
    const samplesPerHalfCycle = Math.floor(SR / rate / 2);
    const firstValue = lfo.process(rate, SR);
    let allSame = true;
    for (let i = 1; i < samplesPerHalfCycle; i++) {
      const val = lfo.process(rate, SR);
      if (Math.abs(val - firstValue) > 0.001) {
        allSame = false;
        break;
      }
    }
    expect(allSame).toBe(true);
  });

  it("LFO completes expected number of cycles", () => {
    const rate = 10; // 10 Hz
    const duration = 1; // 1 second
    const numSamples = SR * duration;
    const samples = generateLFO("sine", rate, numSamples);

    // Count zero crossings (rising) to estimate frequency
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i - 1] ?? 0) <= 0 && (samples[i] ?? 0) > 0) {
        crossings++;
      }
    }

    // Should be approximately 10 cycles in 1 second
    expect(crossings).toBeGreaterThanOrEqual(9);
    expect(crossings).toBeLessThanOrEqual(11);
  });

  it("reset clears phase", () => {
    const lfo = createLFO("sine");
    lfo.process(5, SR);
    lfo.process(5, SR);
    lfo.reset();
    const val = lfo.process(5, SR);
    // After reset, first sample of sine at phase 0 should be near 0
    expect(Math.abs(val)).toBeLessThan(0.01);
  });

  it("shape can be changed at runtime", () => {
    const lfo = createLFO("sine");
    lfo.process(5, SR);
    lfo.shape = "square";
    const val = lfo.process(5, SR);
    expect(Number.isFinite(val)).toBe(true);
  });
});
