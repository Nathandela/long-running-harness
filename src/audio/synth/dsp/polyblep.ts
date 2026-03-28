/**
 * PolyBLEP (Polynomial Bandlimited Step) antialiased oscillator.
 * Corrects discontinuities in naive waveforms to suppress aliasing.
 * O(1) per sample, no lookup tables, pitch-agile.
 */

/** Waveform types supported by the PolyBLEP oscillator */
export type WaveformType = "sine" | "saw" | "square" | "triangle";

/** PolyBLEP correction term for a discontinuity at phase = 0 */
function polyblep(t: number, dt: number): number {
  if (t < dt) {
    const u = t / dt;
    return u + u - u * u - 1;
  }
  if (t > 1 - dt) {
    const u = (t - 1) / dt;
    return u * u + u + u + 1;
  }
  return 0;
}

/**
 * Stateful PolyBLEP oscillator.
 * Call `next()` once per sample to get the output in [-1, 1].
 * Mutates phase internally — zero-allocation in the hot path.
 */
export type PolyBLEPOsc = {
  phase: number;
  type: WaveformType;
  /** Advance one sample. Returns output in [-1, 1]. */
  next(frequency: number, sampleRate: number): number;
  /** Reset phase (e.g. for hard sync). */
  reset(): void;
};

export function createPolyBLEPOsc(type: WaveformType = "saw"): PolyBLEPOsc {
  let phase = 0;
  // Leaky integrator state for triangle wave
  let triState = 0;

  const osc: PolyBLEPOsc = {
    get phase() {
      return phase;
    },
    set phase(p: number) {
      phase = p;
    },
    type,

    next(frequency: number, sampleRate: number): number {
      const dt = frequency / sampleRate; // phase increment per sample

      let out: number;
      switch (osc.type) {
        case "sine":
          out = Math.sin(2 * Math.PI * phase);
          break;

        case "saw": {
          // Naive sawtooth: ramp from -1 to 1
          out = 2 * phase - 1;
          out -= polyblep(phase, dt);
          break;
        }

        case "square": {
          // Naive square: +1 for first half, -1 for second
          out = phase < 0.5 ? 1 : -1;
          out += polyblep(phase, dt);
          out -= polyblep((phase + 0.5) % 1, dt);
          break;
        }

        case "triangle": {
          // Integrated square wave -> triangle via leaky integrator
          let sq = phase < 0.5 ? 1 : -1;
          sq += polyblep(phase, dt);
          sq -= polyblep((phase + 0.5) % 1, dt);
          // Integrate with leak
          triState = dt * sq + (1 - dt) * triState;
          // Scale and clamp to [-1, 1]
          out = Math.max(-1, Math.min(1, triState * 4));
          break;
        }

        default:
          out = 0;
      }

      // Advance phase
      phase += dt;
      if (phase >= 1) phase -= 1;

      return out;
    },

    reset(): void {
      phase = 0;
      triState = 0;
    },
  };

  return osc;
}
