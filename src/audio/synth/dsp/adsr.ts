/**
 * ADSR envelope generator with exponential curves.
 * Runs per-sample in the AudioWorklet — zero allocations.
 *
 * MIT-H4-6: Minimum release time floor of 2ms.
 */

export type ADSRStage = "idle" | "attack" | "decay" | "sustain" | "release";

export type ADSRParams = {
  attack: number; // seconds (0..10)
  decay: number; // seconds (0..10)
  sustain: number; // level (0..1)
  release: number; // seconds (0..10)
};

/** Minimum release time in seconds (MIT-H4-6) */
const MIN_RELEASE_S = 0.002;

/**
 * Stateful ADSR envelope.
 * Call `process()` once per sample. Mutates internal state.
 */
export type ADSREnvelope = {
  stage: ADSRStage;
  level: number;
  /** Trigger note-on. If legato, continues from current level. */
  gate(legato: boolean): void;
  /** Trigger note-off. Begins release from current level. */
  release(): void;
  /** Advance one sample. Returns envelope level [0, 1]. */
  process(params: ADSRParams, sampleRate: number): number;
  /** Hard reset to idle. */
  reset(): void;
};

export function createADSREnvelope(): ADSREnvelope {
  let stage: ADSRStage = "idle";
  let level = 0;
  // Exponential time constant: how many samples to reach ~63% of target
  function timeToCoeff(timeS: number, sampleRate: number): number {
    if (timeS <= 0) return 1;
    // Exponential approach coefficient per sample
    return 1 - Math.exp(-1 / (timeS * sampleRate));
  }

  const env: ADSREnvelope = {
    get stage() {
      return stage;
    },
    get level() {
      return level;
    },

    gate(legato: boolean): void {
      if (!legato) {
        level = 0;
      }
      stage = "attack";
    },

    release(): void {
      if (stage === "idle") return;
      stage = "release";
    },

    process(params: ADSRParams, sampleRate: number): number {
      switch (stage) {
        case "idle":
          level = 0;
          break;

        case "attack": {
          const coeff = timeToCoeff(params.attack, sampleRate);
          // Approach 1.0 + overshoot target for natural curve
          level += coeff * (1.2 - level);
          if (level >= 1) {
            level = 1;
            stage = "decay";
          }
          break;
        }

        case "decay": {
          const coeff = timeToCoeff(params.decay, sampleRate);
          level += coeff * (params.sustain - level);
          // Close enough to sustain level
          if (Math.abs(level - params.sustain) < 0.001) {
            level = params.sustain;
            stage = "sustain";
          }
          break;
        }

        case "sustain":
          level = params.sustain;
          break;

        case "release": {
          const releaseTime = Math.max(params.release, MIN_RELEASE_S);
          const coeff = timeToCoeff(releaseTime, sampleRate);
          level += coeff * (0 - level);
          if (level < 0.0001) {
            level = 0;
            stage = "idle";
          }
          break;
        }
      }

      return level;
    },

    reset(): void {
      stage = "idle";
      level = 0;
    },
  };

  return env;
}
