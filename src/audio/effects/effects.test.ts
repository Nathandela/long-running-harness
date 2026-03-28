import { describe, it, expect, beforeEach, vi } from "vitest";
import { createReverbFactory } from "./reverb";
import { createDelayFactory } from "./delay";
import { createCompressorFactory } from "./compressor";
import { createEqFactory } from "./eq";
import { createDistortionFactory } from "./distortion";
import { createChorusFactory } from "./chorus";
import { createFreeverbFactory } from "./freeverb";
import type { EffectFactory, EffectInstance } from "./types";

// Shared mock AudioContext
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

  const mockBiquadFilter = (): object => ({
    type: "peaking",
    frequency: { value: 1000, setValueAtTime: vi.fn() },
    Q: { value: 1, setValueAtTime: vi.fn() },
    gain: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockOscillator = (): object => ({
    type: "sine",
    frequency: { value: 440, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  });

  const mockConvolver = (): object => ({
    buffer: null,
    normalize: true,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockWaveShaper = (): object => ({
    curve: null,
    oversample: "none",
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockCompressor = (): object => ({
    threshold: { value: -24, setValueAtTime: vi.fn() },
    ratio: { value: 12, setValueAtTime: vi.fn() },
    knee: { value: 30, setValueAtTime: vi.fn() },
    attack: { value: 0.003, setValueAtTime: vi.fn() },
    release: { value: 0.25, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  return {
    createGain: vi.fn().mockImplementation(mockGainNode),
    createDelay: vi.fn().mockImplementation(mockDelayNode),
    createBiquadFilter: vi.fn().mockImplementation(mockBiquadFilter),
    createOscillator: vi.fn().mockImplementation(mockOscillator),
    createConvolver: vi.fn().mockImplementation(mockConvolver),
    createWaveShaper: vi.fn().mockImplementation(mockWaveShaper),
    createDynamicsCompressor: vi.fn().mockImplementation(mockCompressor),
    createBuffer: vi.fn().mockReturnValue({
      getChannelData: vi.fn().mockReturnValue(new Float32Array(44100)),
      length: 44100,
      sampleRate: 44100,
      numberOfChannels: 2,
      duration: 1,
    }),
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    currentTime: 0,
    sampleRate: 44100,
  } as unknown as AudioContext;
}

// Helper for common effect tests
function describeEffect(
  name: string,
  createFactory: () => EffectFactory,
  expectedParams: readonly string[],
): void {
  describe(name, () => {
    let factory: EffectFactory;
    let effect: EffectInstance;

    beforeEach(() => {
      const ctx = createMockAudioContext();
      factory = createFactory();
      effect = factory.create(ctx, `${name}-1`);
    });

    it("has correct definition id and name", () => {
      expect(factory.definition.id).toBeTruthy();
      expect(factory.definition.name).toBeTruthy();
    });

    it("has expected parameters", () => {
      const keys = factory.definition.parameters.map((p) => p.key);
      for (const key of expectedParams) {
        expect(keys).toContain(key);
      }
    });

    it("all parameters have valid ranges (min < max)", () => {
      for (const p of factory.definition.parameters) {
        expect(p.min).toBeLessThan(p.max);
        expect(p.default).toBeGreaterThanOrEqual(p.min);
        expect(p.default).toBeLessThanOrEqual(p.max);
      }
    });

    it("creates an instance with input and output", () => {
      expect(effect.input).toBeDefined();
      expect(effect.output).toBeDefined();
      expect(effect.id).toBe(`${name}-1`);
      expect(effect.typeId).toBe(factory.definition.id);
    });

    it("bypass toggles correctly", () => {
      effect.setBypassed(true);
      expect(effect.bypassed).toBe(true);
      expect(effect.dryGain.gain.value).toBe(1);
      expect(effect.wetGain.gain.value).toBe(0);

      effect.setBypassed(false);
      expect(effect.bypassed).toBe(false);
    });

    it("set and get parameters", () => {
      for (const key of expectedParams) {
        const schema = factory.definition.parameters.find((p) => p.key === key);
        if (!schema) continue;
        const testValue = (schema.min + schema.max) / 2;
        effect.setParam(key, testValue);
        expect(effect.getParam(key)).toBeCloseTo(testValue, 2);
      }
    });

    it("dispose does not throw", () => {
      expect(() => {
        effect.dispose();
      }).not.toThrow();
    });
  });
}

describeEffect("Reverb", createReverbFactory, ["decay", "preDelay", "mix"]);
describeEffect("Delay", createDelayFactory, ["time", "feedback", "mix"]);
describeEffect("Compressor", createCompressorFactory, [
  "threshold",
  "ratio",
  "knee",
  "attack",
  "release",
]);
describeEffect("EQ", createEqFactory, [
  "lowFreq",
  "lowGain",
  "midFreq",
  "midGain",
  "midQ",
  "highFreq",
  "highGain",
]);
describeEffect("Distortion", createDistortionFactory, [
  "drive",
  "curveType",
  "mix",
]);
describeEffect("Chorus", createChorusFactory, ["rate", "depth", "mix"]);
describeEffect("Freeverb", createFreeverbFactory, [
  "roomSize",
  "damping",
  "width",
  "preDelay",
  "mix",
]);

// Effect-specific tests

describe("Delay feedback clamping", () => {
  it("clamps feedback below 1.0", () => {
    const ctx = createMockAudioContext();
    const factory = createDelayFactory();
    const effect = factory.create(ctx, "delay-1");
    effect.setParam("feedback", 1.5);
    expect(effect.getParam("feedback")).toBeLessThanOrEqual(0.95);
  });

  it("allows feedback up to 0.95 maximum", () => {
    const ctx = createMockAudioContext();
    const factory = createDelayFactory();
    const effect = factory.create(ctx, "delay-1");
    effect.setParam("feedback", 0.9);
    expect(effect.getParam("feedback")).toBeCloseTo(0.9);
  });
});

describe("Distortion curve types", () => {
  it("accepts curveType parameter values 0, 1, 2", () => {
    const ctx = createMockAudioContext();
    const factory = createDistortionFactory();
    const effect = factory.create(ctx, "dist-1");

    effect.setParam("curveType", 0);
    expect(effect.getParam("curveType")).toBe(0);

    effect.setParam("curveType", 1);
    expect(effect.getParam("curveType")).toBe(1);

    effect.setParam("curveType", 2);
    expect(effect.getParam("curveType")).toBe(2);
  });
});

describe("EQ band types", () => {
  it("has low shelf, peak, and high shelf bands", () => {
    const factory = createEqFactory();
    const params = factory.definition.parameters;

    // Should have lowFreq, lowGain, midFreq, midGain, midQ, highFreq, highGain
    const keys = params.map((p) => p.key);
    expect(keys).toContain("lowFreq");
    expect(keys).toContain("lowGain");
    expect(keys).toContain("midFreq");
    expect(keys).toContain("midGain");
    expect(keys).toContain("midQ");
    expect(keys).toContain("highFreq");
    expect(keys).toContain("highGain");
  });
});

describe("Reverb impulse responses", () => {
  it("has a decay parameter", () => {
    const factory = createReverbFactory();
    const decayParam = factory.definition.parameters.find(
      (p) => p.key === "decay",
    );
    expect(decayParam).toBeDefined();
    expect(decayParam?.min).toBeGreaterThan(0);
    expect(decayParam?.max).toBeGreaterThan(1);
  });
});
