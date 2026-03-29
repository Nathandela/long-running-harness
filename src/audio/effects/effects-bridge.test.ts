/**
 * Integration test: EffectsBridge syncs Zustand store -> MixerEngine insert chain.
 * Verifies that adding/removing/bypassing effects in the store triggers
 * real WebAudio node wiring in the mixer engine.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useEffectsStore } from "@state/effects";
import { createEffectsBridge, type EffectsBridge } from "./effects-bridge";
import type { EffectRegistry, EffectFactory, EffectInstance } from "./types";
import type { MixerEngine } from "@audio/mixer";

function mockGainNode(): object {
  return {
    gain: { value: 1, setValueAtTime: vi.fn() },
    connect: vi.fn().mockImplementation((dest: object) => dest),
    disconnect: vi.fn(),
  };
}

function createMockInstance(id: string, typeId: string): EffectInstance {
  return {
    id,
    typeId,
    input: mockGainNode() as unknown as AudioNode,
    output: mockGainNode() as unknown as AudioNode,
    dryGain: mockGainNode() as unknown as GainNode,
    wetGain: mockGainNode() as unknown as GainNode,
    bypassed: false,
    getParam: vi.fn().mockReturnValue(0),
    setParam: vi.fn(),
    setBypassed: vi.fn(),
    setMix: vi.fn(),
    getAudioParam: vi.fn(),
    getParamRange: vi.fn(),
    dispose: vi.fn(),
  };
}

function createMockRegistry(): EffectRegistry & {
  _lastCreated: EffectInstance | null;
} {
  let lastCreated: EffectInstance | null = null;
  const factory: EffectFactory = {
    definition: {
      id: "delay",
      name: "Delay",
      parameters: [
        {
          name: "Time",
          key: "time",
          min: 0,
          max: 2,
          default: 0.5,
          step: 0.01,
          unit: "s",
        },
      ],
    },
    create: vi.fn(),
  };

  return {
    _lastCreated: null,
    register: vi.fn(),
    get: vi.fn().mockReturnValue(factory),
    getAll: vi.fn().mockReturnValue([factory]),
    create(typeId: string, _ctx: AudioContext, id?: string) {
      lastCreated = createMockInstance(id ?? typeId, typeId);
      (this as { _lastCreated: EffectInstance | null })._lastCreated =
        lastCreated;
      return lastCreated;
    },
  };
}

function createMockMixer(): MixerEngine {
  return {
    getOrCreateStrip: vi.fn().mockReturnValue({
      trackId: "t1",
      inputGain: mockGainNode(),
      preFaderTap: mockGainNode(),
      faderGain: mockGainNode(),
      panner: { pan: { value: 0 } },
      muteGain: mockGainNode(),
      analyser: mockGainNode(),
      inserts: [],
      muted: false,
      solo: false,
      soloIsolate: false,
    }),
    removeStrip: vi.fn(),
    getStrip: vi.fn(),
    getAllStrips: vi.fn().mockReturnValue([]),
    getMaster: vi.fn(),
    setFaderLevel: vi.fn(),
    setPan: vi.fn(),
    setMute: vi.fn(),
    setSolo: vi.fn(),
    setSoloIsolate: vi.fn(),
    updateSoloState: vi.fn(),
    setMasterLevel: vi.fn(),
    addInsert: vi.fn(),
    replaceInsert: vi.fn(),
    removeInsert: vi.fn(),
    dispose: vi.fn(),
  } as unknown as MixerEngine;
}

function defined<T>(val: T | undefined): T {
  expect(val).toBeDefined();
  return val as T;
}

describe("EffectsBridge", () => {
  let registry: ReturnType<typeof createMockRegistry>;
  let mixer: MixerEngine;
  let bridge: EffectsBridge;
  const ctx = {} as AudioContext;

  beforeEach(() => {
    useEffectsStore.setState({ trackEffects: {} });
    registry = createMockRegistry();
    mixer = createMockMixer();
    bridge = createEffectsBridge(ctx, registry, mixer);
  });

  afterEach(() => {
    bridge.dispose();
  });

  it("creates instance and wires insert when effect added to store", () => {
    useEffectsStore.getState().addEffect("t1", {
      id: "delay-1",
      typeId: "delay",
      bypassed: false,
      params: { time: 0.5 },
    });

    // Bridge should have created an instance
    const instance = bridge.getInstance("delay-1");
    expect(instance).toBeDefined();
    expect(instance?.typeId).toBe("delay");

    // Mixer should have been asked to create the strip and add insert
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mixer.getOrCreateStrip).toHaveBeenCalledWith("t1");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mixer.addInsert).toHaveBeenCalledWith(
      "t1",
      "delay-1",
      expect.anything(),
      expect.anything(),
    );
  });

  it("removes instance and unwires when effect removed from store", () => {
    useEffectsStore.getState().addEffect("t1", {
      id: "delay-1",
      typeId: "delay",
      bypassed: false,
      params: { time: 0.5 },
    });

    const instance = defined(bridge.getInstance("delay-1"));

    useEffectsStore.getState().removeEffect("t1", "delay-1");

    expect(bridge.getInstance("delay-1")).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mixer.removeInsert).toHaveBeenCalledWith("t1", "delay-1");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(instance.dispose).toHaveBeenCalled();
  });

  it("syncs bypass state changes", () => {
    useEffectsStore.getState().addEffect("t1", {
      id: "delay-1",
      typeId: "delay",
      bypassed: false,
      params: { time: 0.5 },
    });

    const instance = defined(bridge.getInstance("delay-1"));

    useEffectsStore.getState().toggleBypass("t1", "delay-1");

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(instance.setBypassed).toHaveBeenCalledWith(true);
  });

  it("syncs parameter changes", () => {
    useEffectsStore.getState().addEffect("t1", {
      id: "delay-1",
      typeId: "delay",
      bypassed: false,
      params: { time: 0.5 },
    });

    const instance = defined(bridge.getInstance("delay-1"));

    useEffectsStore.getState().updateEffectParam("t1", "delay-1", "time", 1.0);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(instance.setParam).toHaveBeenCalledWith("time", 1.0);
  });

  it("syncs pre-existing effects on creation", () => {
    bridge.dispose();

    // Populate store BEFORE creating bridge
    useEffectsStore.getState().addEffect("t1", {
      id: "delay-pre",
      typeId: "delay",
      bypassed: false,
      params: { time: 0.75 },
    });

    registry = createMockRegistry();
    mixer = createMockMixer();
    bridge = createEffectsBridge(ctx, registry, mixer);

    const instance = bridge.getInstance("delay-pre");
    expect(instance).toBeDefined();
    expect(instance?.typeId).toBe("delay");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mixer.addInsert).toHaveBeenCalledWith(
      "t1",
      "delay-pre",
      expect.anything(),
      expect.anything(),
    );
  });

  it("dispose cleans up all instances", () => {
    useEffectsStore.getState().addEffect("t1", {
      id: "delay-1",
      typeId: "delay",
      bypassed: false,
      params: { time: 0.5 },
    });

    const instance = defined(bridge.getInstance("delay-1"));
    bridge.dispose();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(instance.dispose).toHaveBeenCalled();
    expect(bridge.getInstance("delay-1")).toBeUndefined();
  });
});
