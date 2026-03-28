/**
 * Biquad filter coefficient computation.
 * Based on Robert Bristow-Johnson's Audio EQ Cookbook.
 * Supports LP, HP, BP filter types.
 *
 * Runs per-voice in the AudioWorklet — coefficients recomputed
 * only when cutoff/resonance change (not per-sample).
 */

export type FilterType = "lowpass" | "highpass" | "bandpass";

/** Biquad filter coefficients (mutable for zero-allocation writes). */
export type BiquadCoeffs = {
  b0: number;
  b1: number;
  b2: number;
  a0: number;
  a1: number;
  a2: number;
};

/** Create a pre-allocated coefficients struct. */
export function createBiquadCoeffs(): BiquadCoeffs {
  return { b0: 0, b1: 0, b2: 0, a0: 1, a1: 0, a2: 0 };
}

/**
 * Compute biquad filter coefficients into a pre-allocated output object.
 * Zero-allocation: writes directly into `out`.
 */
export function computeBiquadCoeffs(
  type: FilterType,
  cutoff: number,
  q: number,
  sampleRate: number,
  out: BiquadCoeffs,
): void {
  const nyquist = sampleRate / 2;
  const fc = Math.min(Math.max(cutoff, 20), nyquist - 100);
  const qClamped = Math.max(q, 0.1);

  const w0 = (2 * Math.PI * fc) / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * qClamped);

  switch (type) {
    case "lowpass":
      out.b0 = (1 - cosW0) / 2;
      out.b1 = 1 - cosW0;
      out.b2 = (1 - cosW0) / 2;
      out.a0 = 1 + alpha;
      out.a1 = -2 * cosW0;
      out.a2 = 1 - alpha;
      break;

    case "highpass":
      out.b0 = (1 + cosW0) / 2;
      out.b1 = -(1 + cosW0);
      out.b2 = (1 + cosW0) / 2;
      out.a0 = 1 + alpha;
      out.a1 = -2 * cosW0;
      out.a2 = 1 - alpha;
      break;

    case "bandpass":
      out.b0 = alpha;
      out.b1 = 0;
      out.b2 = -alpha;
      out.a0 = 1 + alpha;
      out.a1 = -2 * cosW0;
      out.a2 = 1 - alpha;
      break;
  }
}

/**
 * Stateful biquad filter for per-voice processing.
 * Maintains delay line state. Zero-allocation in process().
 */
export type BiquadFilter = {
  type: FilterType;
  /** Pre-allocated coefficients for this filter instance. */
  readonly coeffs: BiquadCoeffs;
  /** Process a single sample through the filter. */
  process(input: number): number;
  /** Reset delay line state. */
  reset(): void;
};

export function createBiquadFilter(type: FilterType = "lowpass"): BiquadFilter {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;

  const coeffs = createBiquadCoeffs();

  return {
    type,
    coeffs,

    process(input: number): number {
      const output =
        (coeffs.b0 * input +
          coeffs.b1 * x1 +
          coeffs.b2 * x2 -
          coeffs.a1 * y1 -
          coeffs.a2 * y2) /
        coeffs.a0;

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
