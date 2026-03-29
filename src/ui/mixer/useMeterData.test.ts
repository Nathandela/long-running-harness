/**
 * Tests for useMeterData hook.
 * Validates the metering data structure and rAF lifecycle.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMeterData } from "./useMeterData";
import type { MixerEngine } from "@audio/mixer";
import type { ChannelStrip, MasterBus } from "@audio/mixer/types";

// Mock the EffectsBridgeProvider context
vi.mock("@audio/effects/EffectsBridgeProvider", () => ({
  useEffectsBridgeContext: vi.fn(),
}));

import { useEffectsBridgeContext } from "@audio/effects/EffectsBridgeProvider";
const mockUseContext = useEffectsBridgeContext as unknown as ReturnType<
  typeof vi.fn
>;

function mockAnalyser(): AnalyserNode {
  const fftSize = 2048;
  return {
    fftSize,
    getFloatTimeDomainData: vi.fn((buffer: Float32Array) => {
      // Simulate a signal with peak ~0.5
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = 0.5 * Math.sin((2 * Math.PI * i) / buffer.length);
      }
    }),
  } as unknown as AnalyserNode;
}

function mockStrip(trackId: string): ChannelStrip {
  return {
    trackId,
    analyser: mockAnalyser(),
    inputGain: {} as GainNode,
    inserts: [],
    preFaderTap: {} as GainNode,
    faderGain: {} as GainNode,
    panner: {} as StereoPannerNode,
    muteGain: {} as GainNode,
    muted: false,
    solo: false,
    soloIsolate: false,
  };
}

function mockMixer(strips: ChannelStrip[]): MixerEngine {
  return {
    getAllStrips: vi.fn(() => strips),
    getMaster: vi.fn(
      () =>
        ({
          analyser: mockAnalyser(),
        }) as unknown as MasterBus,
    ),
  } as unknown as MixerEngine;
}

let rafCallbacks: Array<(time: number) => void> = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {
    // no-op
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMeterData", () => {
  it("returns empty meter data when no strips exist", () => {
    const mixer = mockMixer([]);
    mockUseContext.mockReturnValue({ mixer });

    const { result } = renderHook(() => useMeterData());

    expect(result.current.channels).toEqual({});
    expect(result.current.master.level).toBe(0);
    expect(result.current.master.peak).toBe(0);
    expect(result.current.master.clipping).toBe(false);
  });

  it("reads meter data after rAF tick", () => {
    const strips = [mockStrip("t1"), mockStrip("t2")];
    const mixer = mockMixer(strips);
    mockUseContext.mockReturnValue({ mixer });

    const { result } = renderHook(() => useMeterData());

    // Trigger one rAF cycle
    act(() => {
      for (const cb of rafCallbacks.splice(0)) {
        cb(performance.now());
      }
    });

    // Should now have meter data for both channels
    const t1 = result.current.channels["t1"];
    expect(t1).toBeDefined();
    expect(t1?.level).toBeGreaterThan(0);
    expect(result.current.channels["t2"]).toBeDefined();
    expect(result.current.master.level).toBeGreaterThan(0);
  });

  it("cancels rAF on unmount", () => {
    const mixer = mockMixer([]);
    mockUseContext.mockReturnValue({ mixer });

    const { unmount } = renderHook(() => useMeterData());
    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
