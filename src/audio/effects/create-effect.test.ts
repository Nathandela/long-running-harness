import { describe, it, expect, beforeEach, vi } from "vitest";
import { createBaseEffect } from "./create-effect";
import type { EffectParameterSchema, EffectInstance } from "./types";

function createMockAudioContext(): AudioContext {
  const mockGainNode = (): object => ({
    gain: { value: 1 },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  return {
    createGain: vi.fn().mockImplementation(mockGainNode),
    destination: { connect: vi.fn() },
  } as unknown as AudioContext;
}

const testParams: readonly EffectParameterSchema[] = [
  {
    name: "Amount",
    key: "amount",
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    unit: "%",
  },
  {
    name: "Tone",
    key: "tone",
    min: 0,
    max: 1,
    default: 0.5,
    step: 0.01,
    unit: "",
  },
];

describe("createBaseEffect", () => {
  let ctx: AudioContext;
  let effect: EffectInstance;

  beforeEach(() => {
    ctx = createMockAudioContext();
    effect = createBaseEffect({
      ctx,
      id: "test-1",
      typeId: "test-effect",
      params: testParams,
      buildChain(inputNode, outputNode) {
        inputNode.connect(outputNode);
      },
      applyParam: vi.fn((_key, _value, _setMix) => {}),
    });
  });

  it("has correct id and typeId", () => {
    expect(effect.id).toBe("test-1");
    expect(effect.typeId).toBe("test-effect");
  });

  it("has input and output nodes", () => {
    expect(effect.input).toBeDefined();
    expect(effect.output).toBeDefined();
  });

  it("has dry and wet gain nodes", () => {
    expect(effect.dryGain).toBeDefined();
    expect(effect.wetGain).toBeDefined();
  });

  it("initializes parameters to defaults", () => {
    expect(effect.getParam("amount")).toBe(50);
    expect(effect.getParam("tone")).toBe(0.5);
  });

  it("sets parameter values", () => {
    effect.setParam("amount", 75);
    expect(effect.getParam("amount")).toBe(75);
  });

  it("clamps parameter values to min/max", () => {
    effect.setParam("amount", 200);
    expect(effect.getParam("amount")).toBe(100);
    effect.setParam("amount", -50);
    expect(effect.getParam("amount")).toBe(0);
  });

  it("ignores unknown parameter keys", () => {
    effect.setParam("nonexistent", 42);
    expect(effect.getParam("nonexistent")).toBe(0);
  });

  it("starts not bypassed", () => {
    expect(effect.bypassed).toBe(false);
  });

  it("sets bypass state", () => {
    effect.setBypassed(true);
    expect(effect.bypassed).toBe(true);
    expect(effect.dryGain.gain.value).toBe(1);
    expect(effect.wetGain.gain.value).toBe(0);
  });

  it("unsets bypass state", () => {
    effect.setBypassed(true);
    effect.setBypassed(false);
    expect(effect.bypassed).toBe(false);
    expect(effect.dryGain.gain.value).toBe(0);
    expect(effect.wetGain.gain.value).toBe(1);
  });

  it("setMix adjusts dry/wet balance", () => {
    effect.setMix(0.5);
    expect(effect.dryGain.gain.value).toBeCloseTo(0.5);
    expect(effect.wetGain.gain.value).toBeCloseTo(0.5);
  });

  it("setMix 0 = fully dry", () => {
    effect.setMix(0);
    expect(effect.dryGain.gain.value).toBe(1);
    expect(effect.wetGain.gain.value).toBe(0);
  });

  it("setMix 1 = fully wet", () => {
    effect.setMix(1);
    expect(effect.dryGain.gain.value).toBe(0);
    expect(effect.wetGain.gain.value).toBe(1);
  });

  it("bypass overrides mix setting", () => {
    effect.setMix(0.5);
    effect.setBypassed(true);
    expect(effect.dryGain.gain.value).toBe(1);
    expect(effect.wetGain.gain.value).toBe(0);
  });

  it("un-bypass restores mix setting", () => {
    effect.setMix(0.5);
    effect.setBypassed(true);
    effect.setBypassed(false);
    expect(effect.dryGain.gain.value).toBeCloseTo(0.5);
    expect(effect.wetGain.gain.value).toBeCloseTo(0.5);
  });

  it("dispose disconnects nodes", () => {
    effect.dispose();
    // Should not throw
  });
});
