/* eslint-disable @typescript-eslint/unbound-method -- vi.fn() mocks are safe to reference unbound */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDrumKit } from "./drum-kit";
import { DRUM_INSTRUMENTS } from "./drum-types";
import type { DrumInstrumentId } from "./drum-types";
import type { MixerEngine } from "@audio/mixer/types";

function createMockAudioContext(): AudioContext {
  const gainNode = (): object => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });

  const filterNode = (): object => ({
    frequency: { value: 1000, setValueAtTime: vi.fn() },
    type: "lowpass",
    Q: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });

  const sourceNode = (): object => ({
    buffer: null,
    playbackRate: { value: 1, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
  });

  return {
    currentTime: 0,
    sampleRate: 48000,
    createGain: vi.fn(() => gainNode()),
    createBiquadFilter: vi.fn(() => filterNode()),
    createBufferSource: vi.fn(() => sourceNode()),
    decodeAudioData: vi.fn(),
  } as unknown as AudioContext;
}

function createSilentBuffer(_ctx: AudioContext): AudioBuffer {
  return {
    length: 4800,
    sampleRate: 48000,
    duration: 0.1,
    numberOfChannels: 1,
    getChannelData: () => new Float32Array(4800),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer;
}

describe("createDrumKit", () => {
  let ctx: AudioContext;
  let samples: Map<DrumInstrumentId, AudioBuffer>;

  beforeEach(() => {
    ctx = createMockAudioContext();
    samples = new Map();
    for (const inst of DRUM_INSTRUMENTS) {
      samples.set(inst.id, createSilentBuffer(ctx));
    }
  });

  it("creates a drum kit", () => {
    const kit = createDrumKit(ctx, samples);
    expect(kit).toBeDefined();
    expect(typeof kit.trigger).toBe("function");
    expect(typeof kit.setParam).toBe("function");
    expect(typeof kit.dispose).toBe("function");
  });

  it("trigger creates a buffer source and starts it", () => {
    const kit = createDrumKit(ctx, samples);
    kit.trigger("bd", 0.1, 0.8);
    expect(ctx.createBufferSource).toHaveBeenCalled();
    expect(ctx.createBiquadFilter).toHaveBeenCalled();
    expect(ctx.createGain).toHaveBeenCalled();
  });

  it("trigger with flam schedules a second hit", () => {
    const kit = createDrumKit(ctx, samples);
    const callsBefore = (ctx.createBufferSource as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    kit.trigger("sd", 0.1, 0.8, 15);
    const callsAfter = (ctx.createBufferSource as ReturnType<typeof vi.fn>).mock
      .calls.length;
    expect(callsAfter - callsBefore).toBe(2);
  });

  it("hi-hat mutual exclusivity: CH cuts OH gain and stops source", () => {
    const kit = createDrumKit(ctx, samples);
    kit.trigger("oh", 0.1, 0.8);

    // Capture the gain node created for OH (first createGain call after output)
    // createGain is called: once for output, once for OH voice
    const gainCalls = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results;
    const ohGainNode = gainCalls[1]?.value as {
      gain: {
        cancelScheduledValues: ReturnType<typeof vi.fn>;
        setValueAtTime: ReturnType<typeof vi.fn>;
      };
    };
    const ohSourceNode = (ctx.createBufferSource as ReturnType<typeof vi.fn>)
      .mock.results[0]?.value as { stop: ReturnType<typeof vi.fn> };

    kit.trigger("ch", 0.15, 0.8);

    // OH gain should be cancelled and zeroed
    expect(ohGainNode.gain.cancelScheduledValues).toHaveBeenCalled();
    expect(ohGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0.15);
    // OH source should be stopped
    expect(ohSourceNode.stop).toHaveBeenCalled();
  });

  it("setParam updates instrument params", () => {
    const kit = createDrumKit(ctx, samples);
    kit.setParam("bd", "tone", 2000);
    kit.setParam("bd", "decay", 0.8);
    kit.setParam("bd", "tune", 1.5);
    kit.setParam("bd", "volume", 0.5);
  });

  it("connectToMixer wires output to mixer strip input", () => {
    const kit = createDrumKit(ctx, samples);
    const mockMixer = {
      getOrCreateStrip: vi.fn(() => ({
        inputGain: { connect: vi.fn() } as unknown as GainNode,
      })),
    } as unknown as MixerEngine;
    kit.connectToMixer(mockMixer, "drum-track");
    expect(mockMixer.getOrCreateStrip).toHaveBeenCalledWith("drum-track");
  });

  it("dispose disconnects output", () => {
    const kit = createDrumKit(ctx, samples);
    kit.dispose();
  });

  it("ignores trigger for missing sample", () => {
    const partialSamples = new Map<DrumInstrumentId, AudioBuffer>();
    partialSamples.set("bd", createSilentBuffer(ctx));
    const kit = createDrumKit(ctx, partialSamples);
    kit.trigger("sd", 0.1, 0.8);
  });

  it("trigger with high velocity uses higher gain", () => {
    const kit = createDrumKit(ctx, samples);
    kit.trigger("sd", 0.1, 1.0);
    // The gain node for the voice should have setValueAtTime called with volume * velocity
    const gainCalls = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results;
    const voiceGain = gainCalls[1]?.value as {
      gain: { setValueAtTime: ReturnType<typeof vi.fn> };
    };
    // Default SD volume=0.8, velocity=1.0 => peak=0.8
    expect(voiceGain.gain.setValueAtTime).toHaveBeenCalledWith(0.8, 0.1);
  });

  it("setParam clamps values to valid ranges", () => {
    const kit = createDrumKit(ctx, samples);
    // Out-of-range values should be clamped
    kit.setParam("bd", "tone", 0);
    kit.trigger("bd", 0, 0.8);
    // tone=0 should be clamped to 200 (min)
    const filterCalls = (ctx.createBiquadFilter as ReturnType<typeof vi.fn>)
      .mock.results;
    const filter = filterCalls[0]?.value as {
      frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    };
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(200, 0);
  });

  it("setParam clamps volume above max to 1", () => {
    const kit = createDrumKit(ctx, samples);
    kit.setParam("bd", "volume", 5);
    kit.trigger("bd", 0, 1.0);
    // volume clamped to 1, velocity=1 => peak=1
    const gainCalls = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results;
    const voiceGain = gainCalls[1]?.value as {
      gain: { setValueAtTime: ReturnType<typeof vi.fn> };
    };
    expect(voiceGain.gain.setValueAtTime).toHaveBeenCalledWith(1, 0);
  });
});
