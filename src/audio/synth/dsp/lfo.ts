/**
 * LFO (Low Frequency Oscillator) for modulation.
 * Supports sine, square, triangle, and sample-and-hold shapes.
 * Output range: [-1, 1], scaled by depth at the modulation destination.
 */

export type LFOShape = "sine" | "square" | "triangle" | "sample-and-hold";

/**
 * Stateful LFO. Call `process()` once per sample.
 * Zero-allocation in the hot path.
 */
export type LFO = {
  shape: LFOShape;
  /** Advance one sample. Returns output in [-1, 1]. */
  process(rate: number, sampleRate: number): number;
  /** Reset phase. */
  reset(): void;
};

export function createLFO(shape: LFOShape = "sine"): LFO {
  let phase = 0;
  let shValue = 0; // Sample-and-hold current value
  let prevPhase = 0; // For detecting S&H trigger

  const lfo: LFO = {
    shape,

    process(rate: number, sampleRate: number): number {
      const dt = rate / sampleRate;
      let out: number;

      switch (lfo.shape) {
        case "sine":
          out = Math.sin(2 * Math.PI * phase);
          break;

        case "square":
          out = phase < 0.5 ? 1 : -1;
          break;

        case "triangle":
          // Ramp 0->1->0 mapped to -1->1->-1
          out = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
          break;

        case "sample-and-hold":
          // New random value each cycle
          if (phase < prevPhase) {
            shValue = Math.random() * 2 - 1;
          }
          out = shValue;
          break;

        default:
          out = 0;
      }

      prevPhase = phase;
      phase += dt;
      if (phase >= 1) phase -= 1;

      return out;
    },

    reset(): void {
      phase = 0;
      prevPhase = 0;
      shValue = 0;
    },
  };

  return lfo;
}
