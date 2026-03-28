/**
 * Biquad filter coefficient computation.
 * Based on Robert Bristow-Johnson's Audio EQ Cookbook.
 * Supports LP, HP, BP filter types.
 *
 * Runs per-voice in the AudioWorklet — coefficients recomputed
 * only when cutoff/resonance change (not per-sample).
 */

export type FilterType = "lowpass" | "highpass" | "bandpass";

/** Biquad filter coefficients: y[n] = (b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]) / a0 */
export type BiquadCoeffs = {
  b0: number;
  b1: number;
  b2: number;
  a0: number;
  a1: number;
  a2: number;
};

/**
 * Compute biquad filter coefficients for the given parameters.
 * @param type Filter type
 * @param cutoff Cutoff frequency in Hz
 * @param q Q factor (resonance), typically 0.5..20
 * @param sampleRate Sample rate in Hz
 */
export function computeBiquadCoeffs(
  type: FilterType,
  cutoff: number,
  q: number,
  sampleRate: number,
): BiquadCoeffs {
  // Clamp cutoff to Nyquist
  const nyquist = sampleRate / 2;
  const fc = Math.min(Math.max(cutoff, 20), nyquist - 100);
  const qClamped = Math.max(q, 0.1);

  const w0 = (2 * Math.PI * fc) / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * qClamped);

  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;

  switch (type) {
    case "lowpass":
      b0 = (1 - cosW0) / 2;
      b1 = 1 - cosW0;
      b2 = (1 - cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;

    case "highpass":
      b0 = (1 + cosW0) / 2;
      b1 = -(1 + cosW0);
      b2 = (1 + cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;

    case "bandpass":
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
      break;
  }

  return { b0, b1, b2, a0, a1, a2 };
}

/**
 * Stateful biquad filter for per-voice processing.
 * Maintains delay line state. Zero-allocation in process().
 */
export type BiquadFilter = {
  type: FilterType;
  /** Process a single sample through the filter. */
  process(input: number, coeffs: BiquadCoeffs): number;
  /** Reset delay line state. */
  reset(): void;
};

export function createBiquadFilter(type: FilterType = "lowpass"): BiquadFilter {
  // Delay line: x[n-1], x[n-2], y[n-1], y[n-2]
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;

  return {
    type,

    process(input: number, coeffs: BiquadCoeffs): number {
      const { b0, b1, b2, a0, a1, a2 } = coeffs;
      const output = (b0 * input + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;

      // Shift delay line
      x2 = x1;
      x1 = input;
      y2 = y1;
      y1 = output;

      return output;
    },

    reset(): void {
      x1 = x2 = y1 = y2 = 0;
    },
  };
}
