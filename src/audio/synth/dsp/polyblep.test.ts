import { describe, it, expect } from "vitest";
import { createPolyBLEPOsc, type WaveformType } from "./polyblep";

const SR = 48000;

/** Generate N samples at the given frequency */
function generate(
  type: WaveformType,
  freq: number,
  numSamples: number,
): Float64Array {
  const osc = createPolyBLEPOsc(type);
  const out = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    out[i] = osc.next(freq, SR);
  }
  return out;
}

/** Simple DFT magnitude at a specific bin frequency */
function dftMagnitude(
  signal: Float64Array,
  targetFreq: number,
  sampleRate: number,
): number {
  const N = signal.length;
  let real = 0;
  let imag = 0;
  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * targetFreq * n) / sampleRate;
    const s = signal[n] ?? 0;
    real += s * Math.cos(angle);
    imag += s * Math.sin(angle);
  }
  return Math.sqrt(real * real + imag * imag) / N;
}

describe("PolyBLEP Oscillator", () => {
  it("sine output stays within [-1, 1]", () => {
    const samples = generate("sine", 440, SR);
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-1);
      expect(samples[i]).toBeLessThanOrEqual(1);
    }
  });

  it("sine at 440Hz has strong fundamental", () => {
    const samples = generate("sine", 440, SR);
    const mag440 = dftMagnitude(samples, 440, SR);
    const mag880 = dftMagnitude(samples, 880, SR);
    // Fundamental should be much stronger than 2nd harmonic
    expect(mag440).toBeGreaterThan(0.3);
    expect(mag880).toBeLessThan(mag440 * 0.01);
  });

  it("saw output stays within [-1.2, 1.2]", () => {
    const samples = generate("saw", 440, SR);
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-1.2);
      expect(samples[i]).toBeLessThanOrEqual(1.2);
    }
  });

  it("saw has correct pitch via FFT", () => {
    const freq = 440;
    const samples = generate("saw", freq, SR);
    const magFundamental = dftMagnitude(samples, freq, SR);
    // Check that the fundamental is the dominant frequency
    // Test a few off-frequencies to ensure peak is at 440
    const magOff = dftMagnitude(samples, freq + 50, SR);
    expect(magFundamental).toBeGreaterThan(magOff * 5);
  });

  it("square has strong odd harmonics, weak even harmonics", () => {
    const freq = 440;
    const samples = generate("square", freq, SR);
    const mag1 = dftMagnitude(samples, freq, SR); // 1st harmonic
    const mag2 = dftMagnitude(samples, freq * 2, SR); // 2nd harmonic (even)
    const mag3 = dftMagnitude(samples, freq * 3, SR); // 3rd harmonic (odd)

    // Square wave should have weak even harmonics
    expect(mag2).toBeLessThan(mag1 * 0.15);
    // 3rd harmonic should be roughly 1/3 of fundamental
    expect(mag3).toBeGreaterThan(mag1 * 0.15);
  });

  it("triangle output stays within [-1, 1]", () => {
    const samples = generate("triangle", 440, SR);
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-1);
      expect(samples[i]).toBeLessThanOrEqual(1);
    }
  });

  it("reset clears phase", () => {
    const osc = createPolyBLEPOsc("saw");
    osc.next(440, SR);
    osc.next(440, SR);
    expect(osc.phase).toBeGreaterThan(0);
    osc.reset();
    expect(osc.phase).toBe(0);
  });

  it("waveform type can be changed at runtime", () => {
    const osc = createPolyBLEPOsc("sine");
    osc.next(440, SR);
    osc.type = "saw";
    // Should not throw
    const val = osc.next(440, SR);
    expect(Number.isFinite(val)).toBe(true);
  });

  it("handles very low frequencies", () => {
    const osc = createPolyBLEPOsc("saw");
    const val = osc.next(1, SR);
    expect(Number.isFinite(val)).toBe(true);
  });

  it("handles high frequencies near Nyquist", () => {
    const osc = createPolyBLEPOsc("saw");
    const val = osc.next(20000, SR);
    expect(Number.isFinite(val)).toBe(true);
  });
});
