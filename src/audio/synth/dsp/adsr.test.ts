import { describe, it, expect } from "vitest";
import { createADSREnvelope, type ADSRParams } from "./adsr";

const SR = 48000;

/** Run the envelope for N samples with the given params */
function runEnvelope(
  params: ADSRParams,
  gateSamples: number,
  totalSamples: number,
  legato = false,
): Float64Array {
  const env = createADSREnvelope();
  const out = new Float64Array(totalSamples);

  env.gate(legato);

  for (let i = 0; i < totalSamples; i++) {
    if (i === gateSamples) {
      env.release();
    }
    out[i] = env.process(params, SR);
  }

  return out;
}

describe("ADSR Envelope", () => {
  const defaultParams: ADSRParams = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.7,
    release: 0.2,
  };

  it("starts at idle with level 0", () => {
    const env = createADSREnvelope();
    expect(env.stage).toBe("idle");
    expect(env.level).toBe(0);
  });

  it("attack reaches peak (~1.0)", () => {
    const params: ADSRParams = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.2,
    };

    const env = createADSREnvelope();
    env.gate(false);

    // Run through attack phase (0.01s = 480 samples)
    let maxLevel = 0;
    for (let i = 0; i < 960; i++) {
      const val = env.process(params, SR);
      if (val > maxLevel) maxLevel = val;
    }

    expect(maxLevel).toBeGreaterThan(0.95);
  });

  it("decay settles to sustain level", () => {
    const gateLength = SR; // 1 second - enough to reach sustain
    const samples = runEnvelope(defaultParams, gateLength, gateLength);

    // Last samples should be near sustain level
    const lastSample = samples[samples.length - 1] ?? 0;
    expect(lastSample).toBeCloseTo(defaultParams.sustain, 1);
  });

  it("release decays to zero", () => {
    const gateLength = Math.floor(SR * 0.5); // 0.5s gate
    const totalLength = Math.floor(SR * 2); // 2s total
    const samples = runEnvelope(defaultParams, gateLength, totalLength);

    // Last samples should be near zero
    const lastSample = samples[samples.length - 1] ?? 0;
    expect(lastSample).toBeLessThan(0.001);
  });

  it("returns to idle stage after release", () => {
    const env = createADSREnvelope();
    env.gate(false);

    const params = { attack: 0.001, decay: 0.001, sustain: 0.5, release: 0.01 };

    // Run through attack + decay + sustain
    for (let i = 0; i < SR; i++) {
      env.process(params, SR);
    }

    env.release();

    // Run through release
    for (let i = 0; i < SR; i++) {
      env.process(params, SR);
    }

    expect(env.stage).toBe("idle");
  });

  it("minimum release floor of 2ms (MIT-H4-6)", () => {
    const params: ADSRParams = {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.8,
      release: 0, // Zero release time - should be floored to 2ms
    };

    const env = createADSREnvelope();
    env.gate(false);

    // Run to sustain
    for (let i = 0; i < SR; i++) {
      env.process(params, SR);
    }

    env.release();

    // With 2ms floor at 48kHz = 96 samples
    // After 1 sample, level should still be above zero
    const firstReleaseSample = env.process(params, SR);
    expect(firstReleaseSample).toBeGreaterThan(0);

    // After ~96+ samples, it should be decaying but not instant
    for (let i = 0; i < 50; i++) {
      env.process(params, SR);
    }
    expect(env.level).toBeGreaterThan(0);
  });

  it("legato mode continues from current level", () => {
    const params: ADSRParams = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.2,
    };

    const env = createADSREnvelope();

    // First note
    env.gate(false);
    for (let i = 0; i < Math.floor(SR * 0.3); i++) {
      env.process(params, SR);
    }

    const levelBeforeLegato = env.level;

    // Legato re-trigger: should NOT reset to zero
    env.gate(true);
    const levelAfterLegato = env.process(params, SR);

    // Level should continue from where it was, not drop to zero
    expect(levelAfterLegato).toBeGreaterThan(levelBeforeLegato * 0.5);
  });

  it("non-legato gate resets to zero", () => {
    const params: ADSRParams = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.2,
    };

    const env = createADSREnvelope();
    env.gate(false);

    // Reach sustain
    for (let i = 0; i < SR; i++) {
      env.process(params, SR);
    }

    // Non-legato re-trigger
    env.gate(false);
    // Level should be reset to zero at start of new attack
    // The first process after gate will start from 0
    expect(env.level).toBe(0);
  });

  it("reset returns to idle", () => {
    const env = createADSREnvelope();
    env.gate(false);
    env.process(defaultParams, SR);
    env.reset();
    expect(env.stage).toBe("idle");
    expect(env.level).toBe(0);
  });

  it("envelope values are always finite", () => {
    const params: ADSRParams = {
      attack: 0,
      decay: 0,
      sustain: 1,
      release: 0,
    };

    const env = createADSREnvelope();
    env.gate(false);

    for (let i = 0; i < 1000; i++) {
      const val = env.process(params, SR);
      expect(Number.isFinite(val)).toBe(true);
    }
  });
});
