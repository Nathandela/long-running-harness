import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClipScheduler } from "./clip-scheduler";
import type { ClipModel } from "@state/track/types";

type MockFn = ReturnType<typeof vi.fn>;

function mockAudioContext(): AudioContext & {
  createBufferSource: MockFn;
  createGain: MockFn;
} {
  const mockSource = (): object => ({
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    playbackRate: { value: 1 },
    onended: null as (() => void) | null,
    addEventListener: vi.fn(),
  });

  const mockGain = (): object => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });

  return {
    createBufferSource: vi.fn().mockImplementation(mockSource),
    createGain: vi.fn().mockImplementation(mockGain),
    currentTime: 10,
    sampleRate: 44100,
  } as unknown as AudioContext & {
    createBufferSource: MockFn;
    createGain: MockFn;
  };
}

function makeClip(overrides: Partial<ClipModel> = {}): ClipModel {
  return {
    id: "clip-1",
    trackId: "track-1",
    sourceId: "source-1",
    startTime: 5,
    sourceOffset: 0,
    duration: 10,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Test Clip",
    ...overrides,
  };
}

function makeAudioBuffer(): AudioBuffer {
  return {
    duration: 30,
    length: 30 * 44100,
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: vi.fn(),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer;
}

describe("ClipScheduler", () => {
  let ctx: ReturnType<typeof mockAudioContext>;

  beforeEach(() => {
    ctx = mockAudioContext();
  });

  it("schedules a clip that falls in the look-ahead window", () => {
    const scheduler = createClipScheduler(ctx);
    const clip = makeClip({ startTime: 10.05, duration: 5 });
    const buffer = makeAudioBuffer();
    const destination = ctx.createGain() as unknown as AudioNode;

    scheduler.scheduleClips(
      [clip],
      10,
      10.1,
      (id) => (id === "source-1" ? buffer : undefined),
      destination,
    );

    expect(ctx.createBufferSource).toHaveBeenCalled();
  });

  it("does not schedule clips outside the window", () => {
    const scheduler = createClipScheduler(ctx);
    const clip = makeClip({ startTime: 20 });
    const buffer = makeAudioBuffer();
    const destination = ctx.createGain() as unknown as AudioNode;

    scheduler.scheduleClips([clip], 10, 10.1, () => buffer, destination);

    expect(ctx.createBufferSource).not.toHaveBeenCalled();
  });

  it("does not re-schedule an already-scheduled clip", () => {
    const scheduler = createClipScheduler(ctx);
    const clip = makeClip({ startTime: 10.05 });
    const buffer = makeAudioBuffer();
    const destination = ctx.createGain() as unknown as AudioNode;
    const getBuffer = (): AudioBuffer | undefined => buffer;

    scheduler.scheduleClips([clip], 10, 10.1, getBuffer, destination);
    scheduler.scheduleClips([clip], 10, 10.1, getBuffer, destination);

    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
  });

  it("applies source offset when scheduling", () => {
    const scheduler = createClipScheduler(ctx);
    const clip = makeClip({ startTime: 10.05, sourceOffset: 2 });
    const buffer = makeAudioBuffer();
    const destination = ctx.createGain() as unknown as AudioNode;

    scheduler.scheduleClips([clip], 10, 10.1, () => buffer, destination);

    const source = ctx.createBufferSource.mock.results[0]?.value as {
      start: MockFn;
    };
    expect(source.start).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("stops all scheduled clips on stopAll", () => {
    const scheduler = createClipScheduler(ctx);
    const clip = makeClip({ startTime: 10.05 });
    const buffer = makeAudioBuffer();
    const destination = ctx.createGain() as unknown as AudioNode;

    scheduler.scheduleClips([clip], 10, 10.1, () => buffer, destination);
    scheduler.stopAll();

    const source = ctx.createBufferSource.mock.results[0]?.value as {
      stop: MockFn;
    };
    expect(source.stop).toHaveBeenCalled();
  });

  it("applies clip gain via gain node", () => {
    const scheduler = createClipScheduler(ctx);
    const clip = makeClip({ startTime: 10.05, gain: 0.5 });
    const buffer = makeAudioBuffer();
    const destination = ctx.createGain() as unknown as AudioNode;

    scheduler.scheduleClips([clip], 10, 10.1, () => buffer, destination);

    expect(ctx.createGain).toHaveBeenCalled();
  });
});
