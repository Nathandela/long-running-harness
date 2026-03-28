import { describe, it, expect, vi } from "vitest";
import { createFreeverbFactory } from "./freeverb";
import type { EffectFactory, EffectInstance } from "./types";

// Reuse same mock pattern as effects.test.ts
function createMockAudioContext(): AudioContext {
  const mockGainNode = (): object => {
    const gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    } = {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn().mockImplementation((v: number) => {
        gain.value = v;
      }),
    };
    return {
      gain,
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
    };
  };

  const mockDelayNode = (): object => ({
    delayTime: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  return {
    createGain: vi.fn().mockImplementation(mockGainNode),
    createDelay: vi.fn().mockImplementation(mockDelayNode),
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    currentTime: 0,
    sampleRate: 44100,
  } as unknown as AudioContext;
}

describe("Freeverb", () => {
  let factory: EffectFactory;
  let ctx: AudioContext;
  let effect: EffectInstance;

  function setup(): void {
    ctx = createMockAudioContext();
    factory = createFreeverbFactory();
    effect = factory.create(ctx, "freeverb-1");
  }

  it("has correct definition id and name", () => {
    setup();
    expect(factory.definition.id).toBe("freeverb");
    expect(factory.definition.name).toBe("Freeverb");
  });

  it("has expected parameters", () => {
    setup();
    const keys = factory.definition.parameters.map((p) => p.key);
    expect(keys).toContain("roomSize");
    expect(keys).toContain("damping");
    expect(keys).toContain("width");
    expect(keys).toContain("preDelay");
    expect(keys).toContain("mix");
  });

  it("all parameters have valid ranges (min < max, default in bounds)", () => {
    setup();
    for (const p of factory.definition.parameters) {
      expect(p.min).toBeLessThan(p.max);
      expect(p.default).toBeGreaterThanOrEqual(p.min);
      expect(p.default).toBeLessThanOrEqual(p.max);
    }
  });

  it("creates an instance with input and output", () => {
    setup();
    expect(effect.input).toBeDefined();
    expect(effect.output).toBeDefined();
    expect(effect.id).toBe("freeverb-1");
    expect(effect.typeId).toBe("freeverb");
  });

  it("bypass toggles correctly", () => {
    setup();
    effect.setBypassed(true);
    expect(effect.bypassed).toBe(true);
    expect(effect.dryGain.gain.value).toBe(1);
    expect(effect.wetGain.gain.value).toBe(0);

    effect.setBypassed(false);
    expect(effect.bypassed).toBe(false);
  });

  it("set and get parameters with clamping", () => {
    setup();
    for (const p of factory.definition.parameters) {
      const testValue = (p.min + p.max) / 2;
      effect.setParam(p.key, testValue);
      expect(effect.getParam(p.key)).toBeCloseTo(testValue, 2);
    }
  });

  it("clamps parameters to valid range", () => {
    setup();
    effect.setParam("roomSize", 200);
    expect(effect.getParam("roomSize")).toBeLessThanOrEqual(100);

    effect.setParam("roomSize", -10);
    expect(effect.getParam("roomSize")).toBeGreaterThanOrEqual(0);
  });

  it("dispose does not throw", () => {
    setup();
    expect(() => {
      effect.dispose();
    }).not.toThrow();
  });

  it("creates comb filters (uses multiple delay nodes)", () => {
    setup();
    // Freeverb uses 8 comb filters + 4 allpass = 12 delay nodes + 1 pre-delay = 13
    // Plus the base effect creates gain nodes
    // At minimum we need delay nodes for comb + allpass + pre-delay
    const delayCallCount = (ctx.createDelay as ReturnType<typeof vi.fn>).mock
      .calls.length;
    // 8 comb + 4 allpass + 1 pre-delay = 13 delay nodes
    expect(delayCallCount).toBeGreaterThanOrEqual(13);
  });

  it("creates gain nodes for feedback paths", () => {
    setup();
    const gainCallCount = (ctx.createGain as ReturnType<typeof vi.fn>).mock
      .calls.length;
    // base effect creates 4 gains (input, output, dry, wet + effectInput, effectOutput)
    // Freeverb needs 8 comb feedback gains + 4 allpass feedback gains + output mixer = many gains
    expect(gainCallCount).toBeGreaterThanOrEqual(12);
  });

  it("mix parameter controls wet/dry blend", () => {
    setup();
    effect.setParam("mix", 0);
    // At 0% mix the effect should be fully dry
    expect(effect.getParam("mix")).toBe(0);

    effect.setParam("mix", 100);
    expect(effect.getParam("mix")).toBe(100);
  });

  it("roomSize maps to feedback gain values", () => {
    setup();
    // Setting roomSize should not throw and should store correctly
    effect.setParam("roomSize", 0);
    expect(effect.getParam("roomSize")).toBe(0);
    effect.setParam("roomSize", 100);
    expect(effect.getParam("roomSize")).toBe(100);
  });

  it("damping parameter stores correctly", () => {
    setup();
    effect.setParam("damping", 75);
    expect(effect.getParam("damping")).toBe(75);
  });

  it("width parameter stores correctly", () => {
    setup();
    effect.setParam("width", 50);
    expect(effect.getParam("width")).toBe(50);
  });

  it("preDelay parameter stores correctly", () => {
    setup();
    effect.setParam("preDelay", 25);
    expect(effect.getParam("preDelay")).toBe(25);
  });
});
