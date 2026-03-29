import { describe, it, expect, vi } from "vitest";
import { createParamResolver } from "./create-param-resolver";
import type { AutomationLane } from "./automation-types";
import type { MixerEngine } from "@audio/mixer";
import type { EffectsBridge } from "@audio/effects/effects-bridge";

function makeLane(
  trackId: string,
  target: AutomationLane["target"],
): AutomationLane {
  return {
    id: `lane-${trackId}`,
    trackId,
    target,
    points: [],
    mode: "read",
    armed: true,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function mockStrip() {
  return {
    trackId: "t1",
    inputGain: {} as GainNode,
    inserts: [],
    preFaderTap: {} as GainNode,
    faderGain: { gain: { value: 1 } } as unknown as GainNode,
    panner: { pan: { value: 0 } } as unknown as StereoPannerNode,
    muteGain: {} as GainNode,
    analyser: {} as AnalyserNode,
    muted: false,
    solo: false,
    soloIsolate: false,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function mockMixer(strip: ReturnType<typeof mockStrip> | undefined) {
  return {
    getStrip: vi.fn().mockReturnValue(strip),
  } as unknown as MixerEngine;
}

const stubBridge = {} as EffectsBridge;

describe("createParamResolver", () => {
  it("resolves mixer volume to faderGain.gain", () => {
    const strip = mockStrip();
    const resolver = createParamResolver(mockMixer(strip), stubBridge);

    const result = resolver(makeLane("t1", { type: "mixer", param: "volume" }));

    expect(result).toBeDefined();
    expect(result?.param).toBe(strip.faderGain.gain);
    expect(result?.range).toEqual({ min: 0, max: 2 });
  });

  it("resolves mixer pan to panner.pan", () => {
    const strip = mockStrip();
    const resolver = createParamResolver(mockMixer(strip), stubBridge);

    const result = resolver(makeLane("t1", { type: "mixer", param: "pan" }));

    expect(result).toBeDefined();
    expect(result?.param).toBe(strip.panner.pan);
    expect(result?.range).toEqual({ min: -1, max: 1 });
  });

  it("returns undefined for unknown track", () => {
    const resolver = createParamResolver(mockMixer(undefined), stubBridge);

    const result = resolver(
      makeLane("missing", { type: "mixer", param: "volume" }),
    );

    expect(result).toBeUndefined();
  });

  it("resolves effect param when bridge returns AudioParam", () => {
    const strip = mockStrip();
    const mockParam = { value: 0.5 } as unknown as AudioParam;
    const mockInstance = {
      getAudioParam: vi.fn().mockReturnValue(mockParam),
      getParamRange: vi.fn().mockReturnValue({ min: -60, max: 0 }),
    };
    const bridge = {
      getInstance: vi.fn().mockReturnValue(mockInstance),
    } as unknown as EffectsBridge;

    const resolver = createParamResolver(mockMixer(strip), bridge);
    const result = resolver(
      makeLane("t1", {
        type: "effect",
        effectId: "eq-1",
        paramKey: "lowGain",
      }),
    );

    expect(result).toBeDefined();
    expect(result?.param).toBe(mockParam);
    expect(result?.range).toEqual({ min: -60, max: 0 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(bridge.getInstance).toHaveBeenCalledWith("eq-1");
    expect(mockInstance.getAudioParam).toHaveBeenCalledWith("lowGain");
  });

  it("returns undefined for effect when instance not found", () => {
    const strip = mockStrip();
    const bridge = {
      getInstance: vi.fn().mockReturnValue(undefined),
    } as unknown as EffectsBridge;

    const resolver = createParamResolver(mockMixer(strip), bridge);
    const result = resolver(
      makeLane("t1", {
        type: "effect",
        effectId: "missing-fx",
        paramKey: "rate",
      }),
    );

    expect(result).toBeUndefined();
  });

  it("returns undefined for effect when AudioParam not exposed", () => {
    const strip = mockStrip();
    const mockInstance = {
      getAudioParam: vi.fn().mockReturnValue(undefined),
      getParamRange: vi.fn().mockReturnValue({ min: 0, max: 1 }),
    };
    const bridge = {
      getInstance: vi.fn().mockReturnValue(mockInstance),
    } as unknown as EffectsBridge;

    const resolver = createParamResolver(mockMixer(strip), bridge);
    const result = resolver(
      makeLane("t1", {
        type: "effect",
        effectId: "eq-1",
        paramKey: "unknownParam",
      }),
    );

    expect(result).toBeUndefined();
  });

  it("returns undefined for synth targets (not yet supported)", () => {
    const strip = mockStrip();
    const resolver = createParamResolver(mockMixer(strip), stubBridge);

    const result = resolver(
      makeLane("t1", { type: "synth", paramKey: "filterCutoff" }),
    );

    expect(result).toBeUndefined();
  });

  it("passes trackId to mixer.getStrip", () => {
    const getStrip = vi.fn().mockReturnValue(mockStrip());
    const mixer = { getStrip } as unknown as MixerEngine;
    const resolver = createParamResolver(mixer, stubBridge);

    resolver(makeLane("track-42", { type: "mixer", param: "volume" }));

    expect(getStrip).toHaveBeenCalledWith("track-42");
  });
});
