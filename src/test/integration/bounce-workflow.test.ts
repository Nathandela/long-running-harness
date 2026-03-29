/**
 * Integration tests: Bounce engine & end-to-end workflow [E17->E7].
 *
 * Verifies:
 * - Bounce engine offline graph reconstruction
 * - Session bounds computation with mute/solo filtering
 * - Event timeline building across track types
 * - Full import->arrange->mix->export workflow (unit level)
 * - Cancellation during bounce
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createBounceEngine,
  computeSessionBounds,
  buildEventTimeline,
} from "@audio/bounce/bounce-engine";
import type {
  BounceOptions,
  BounceProgress,
  BounceResult,
} from "@audio/bounce/types";
import type { AudioClipModel, MidiClipModel } from "@state/track/types";
import {
  makeTrack,
  makeAudioClip,
  makeMidiClip,
  makeNoteEvent,
  makeAutomationLane,
  makeAutomationPoint,
  resetIdCounter,
  createMockAudioContext,
} from "./helpers";

describe("Session bounds computation", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("computes bounds from audible clips", () => {
    const track = makeTrack({ id: "t1", clipIds: ["c1", "c2"] });
    const clips: Record<string, AudioClipModel> = {
      c1: makeAudioClip({
        id: "c1",
        trackId: "t1",
        startTime: 1,
        duration: 2,
      }),
      c2: makeAudioClip({
        id: "c2",
        trackId: "t1",
        startTime: 5,
        duration: 3,
      }),
    };

    const bounds = computeSessionBounds([track], clips);
    expect(bounds.start).toBe(1);
    expect(bounds.end).toBe(8);
  });

  it("excludes muted tracks", () => {
    const t1 = makeTrack({ id: "t1", clipIds: ["c1"], muted: true });
    const t2 = makeTrack({ id: "t2", clipIds: ["c2"] });
    const clips = {
      c1: makeAudioClip({
        id: "c1",
        trackId: "t1",
        startTime: 0,
        duration: 10,
      }),
      c2: makeAudioClip({
        id: "c2",
        trackId: "t2",
        startTime: 2,
        duration: 1,
      }),
    };

    const bounds = computeSessionBounds([t1, t2], clips);
    expect(bounds.start).toBe(2);
    expect(bounds.end).toBe(3);
  });

  it("solo mode includes only soloed tracks", () => {
    const t1 = makeTrack({ id: "t1", clipIds: ["c1"], solo: true });
    const t2 = makeTrack({ id: "t2", clipIds: ["c2"] });
    const clips = {
      c1: makeAudioClip({
        id: "c1",
        trackId: "t1",
        startTime: 0,
        duration: 2,
      }),
      c2: makeAudioClip({
        id: "c2",
        trackId: "t2",
        startTime: 5,
        duration: 5,
      }),
    };

    const bounds = computeSessionBounds([t1, t2], clips);
    expect(bounds.start).toBe(0);
    expect(bounds.end).toBe(2); // Only t1's clip
  });

  it("solo mode includes soloIsolate tracks", () => {
    const t1 = makeTrack({ id: "t1", clipIds: ["c1"], solo: true });
    const t2 = makeTrack({ id: "t2", clipIds: ["c2"] });
    const t3 = makeTrack({
      id: "t3",
      clipIds: ["c3"],
      soloIsolate: true,
    });
    const clips = {
      c1: makeAudioClip({
        id: "c1",
        trackId: "t1",
        startTime: 0,
        duration: 2,
      }),
      c2: makeAudioClip({
        id: "c2",
        trackId: "t2",
        startTime: 5,
        duration: 5,
      }),
      c3: makeAudioClip({
        id: "c3",
        trackId: "t3",
        startTime: 1,
        duration: 4,
      }),
    };

    const bounds = computeSessionBounds([t1, t2, t3], clips);
    // t1 (soloed) and t3 (soloIsolate) are audible; t2 is excluded
    expect(bounds.start).toBe(0);
    expect(bounds.end).toBe(5); // t3 ends at 1+4=5
  });

  it("returns zero bounds when no audible clips", () => {
    const track = makeTrack({ id: "t1", clipIds: [], muted: true });
    const bounds = computeSessionBounds([track], {});
    expect(bounds.start).toBe(0);
    expect(bounds.end).toBe(0);
  });
});

describe("Event timeline building", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("separates audio and MIDI clips", () => {
    const t1 = makeTrack({ id: "t1", clipIds: ["ac1"] });
    const t2 = makeTrack({ id: "t2", clipIds: ["mc1"] });

    const clips: Record<string, AudioClipModel | MidiClipModel> = {
      ac1: makeAudioClip({ id: "ac1", trackId: "t1" }),
      mc1: makeMidiClip({
        id: "mc1",
        trackId: "t2",
        noteEvents: [makeNoteEvent()],
      }),
    };

    const timeline = buildEventTimeline([t1, t2], clips);
    expect(timeline.audioClips).toHaveLength(1);
    expect(timeline.midiClips).toHaveLength(1);
    expect(timeline.audioClips[0]?.trackId).toBe("t1");
    expect(timeline.midiClips[0]?.trackId).toBe("t2");
  });

  it("excludes clips from muted tracks", () => {
    const t1 = makeTrack({ id: "t1", clipIds: ["c1"], muted: true });
    const clips = {
      c1: makeAudioClip({ id: "c1", trackId: "t1" }),
    };

    const timeline = buildEventTimeline([t1], clips);
    expect(timeline.audioClips).toHaveLength(0);
  });
});

describe("BounceEngine integration", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  function createMockOfflineContext(
    duration: number,
    sampleRate: number,
  ): OfflineAudioContext {
    const ctx = createMockAudioContext() as unknown as Record<string, unknown>;
    const length = Math.ceil(duration * sampleRate);

    const renderedBuffer = {
      numberOfChannels: 2,
      length,
      sampleRate,
      duration,
      getChannelData(_c: number): Float32Array {
        return new Float32Array(length);
      },
      copyToChannel: vi.fn(),
      copyFromChannel: vi.fn(),
    };

    ctx["startRendering"] = vi.fn().mockResolvedValue(renderedBuffer);
    ctx["sampleRate"] = sampleRate;
    ctx["destination"] = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      channelCount: 2,
    };

    return ctx as unknown as OfflineAudioContext;
  }

  function makeBounceOptions(
    overrides: Partial<BounceOptions> = {},
  ): BounceOptions {
    const track = makeTrack({ id: "t1", clipIds: ["c1"] });
    const clip = makeAudioClip({
      id: "c1",
      trackId: "t1",
      startTime: 0,
      duration: 2,
      sourceId: "src-1",
    });

    const mockBuffer = {
      numberOfChannels: 2,
      length: 88200,
      sampleRate: 44100,
      duration: 2,
      getChannelData: () => new Float32Array(88200),
      copyToChannel: vi.fn(),
      copyFromChannel: vi.fn(),
    } as unknown as AudioBuffer;

    return {
      sampleRate: 44100,
      bitDepth: 16,
      range: { type: "session" },
      tracks: [track],
      clips: { c1: clip },
      automationLanes: [],
      masterLevel: 1,
      getBuffer: () => mockBuffer,
      instruments: new Map(),
      ...overrides,
    };
  }

  async function drainGenerator(
    gen: AsyncGenerator<BounceProgress, BounceResult>,
  ): Promise<{ phases: BounceProgress[]; result: BounceResult }> {
    const phases: BounceProgress[] = [];
    let iterResult: IteratorResult<BounceProgress, BounceResult>;
    do {
      iterResult = await gen.next();
      if (iterResult.done !== true) {
        phases.push(iterResult.value);
      }
    } while (iterResult.done !== true);
    return { phases, result: iterResult.value };
  }

  it("bounces a session and produces a WAV blob", async () => {
    const engine = createBounceEngine(createMockOfflineContext);
    const options = makeBounceOptions();
    const gen = engine.bounce(options);

    const { phases, result } = await drainGenerator(gen);

    // Should have gone through preparing -> rendering -> encoding -> complete
    const phaseNames = phases.map((p) => p.phase);
    expect(phaseNames).toContain("preparing");
    expect(phaseNames).toContain("rendering");
    expect(phaseNames).toContain("encoding");
    expect(phaseNames).toContain("complete");

    expect(result.blob).toBeDefined();
    expect(result.duration).toBe(2);
  });

  it("returns empty result for zero-duration session", async () => {
    const engine = createBounceEngine(createMockOfflineContext);
    const options = makeBounceOptions({
      tracks: [makeTrack({ id: "t1", clipIds: [] })],
      clips: {},
    });

    const { result } = await drainGenerator(engine.bounce(options));
    expect(result.duration).toBe(0);
  });

  it("rejects invalid sample rate", async () => {
    const engine = createBounceEngine(createMockOfflineContext);
    const options = makeBounceOptions({ sampleRate: 0 });

    const gen = engine.bounce(options);
    await expect(gen.next()).rejects.toThrow("invalid sampleRate");
  });

  it("prevents concurrent bounces", async () => {
    const engine = createBounceEngine(createMockOfflineContext);
    const options = makeBounceOptions();

    const gen1 = engine.bounce(options);
    await gen1.next(); // Start first bounce

    const gen2 = engine.bounce(options);
    await expect(gen2.next()).rejects.toThrow("another bounce is active");

    // Drain first generator
    await drainGenerator(gen1);
  });

  it("cancellation stops bounce early", async () => {
    const engine = createBounceEngine(createMockOfflineContext);
    const options = makeBounceOptions();

    const gen = engine.bounce(options);
    await gen.next(); // preparing phase

    engine.cancel();

    const { result } = await drainGenerator(gen);
    expect(result.duration).toBe(0); // Cancelled = empty result
  });

  it("region bounce respects start/end range", async () => {
    const engine = createBounceEngine(createMockOfflineContext);
    const track = makeTrack({ id: "t1", clipIds: ["c1"] });
    const clip = makeAudioClip({
      id: "c1",
      trackId: "t1",
      startTime: 0,
      duration: 10,
    });

    const options = makeBounceOptions({
      range: { type: "region", start: 2, end: 5 },
      tracks: [track],
      clips: { c1: clip },
    });

    const { result } = await drainGenerator(engine.bounce(options));
    expect(result.duration).toBe(3); // 5 - 2
  });
});

describe("End-to-end workflow: import -> arrange -> mix -> export", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("full pipeline: tracks + clips + effects + automation -> bounce", async () => {
    // 1. Create tracks (arrangement)
    const audioTrack = makeTrack({
      id: "audio-1",
      name: "Vocal",
      type: "audio",
      clipIds: ["ac-1"],
      volume: 0.9,
      pan: -0.2,
    });
    const synthTrack = makeTrack({
      id: "synth-1",
      name: "Lead Synth",
      type: "instrument",
      clipIds: ["mc-1"],
      volume: 0.7,
      pan: 0.3,
    });

    // 2. Create clips
    const audioClip = makeAudioClip({
      id: "ac-1",
      trackId: "audio-1",
      startTime: 0,
      duration: 8,
      gain: 0.85,
      fadeIn: 0.05,
      fadeOut: 0.1,
    });
    const midiClip = makeMidiClip({
      id: "mc-1",
      trackId: "synth-1",
      startTime: 2,
      duration: 6,
      noteEvents: [
        makeNoteEvent({ pitch: 60, startTime: 0, duration: 1 }),
        makeNoteEvent({ pitch: 64, startTime: 1, duration: 1 }),
        makeNoteEvent({ pitch: 67, startTime: 2, duration: 2 }),
      ],
    });

    // 3. Automation
    const volumeAutomation = makeAutomationLane({
      trackId: "audio-1",
      target: { type: "mixer", param: "volume" },
      points: [
        makeAutomationPoint({ time: 0, value: 0.8 }),
        makeAutomationPoint({ time: 4, value: 0.3 }),
        makeAutomationPoint({ time: 8, value: 0.8 }),
      ],
    });

    // 4. Verify session bounds
    const clips: Record<string, AudioClipModel | MidiClipModel> = {
      "ac-1": audioClip,
      "mc-1": midiClip,
    };
    const bounds = computeSessionBounds([audioTrack, synthTrack], clips);
    expect(bounds.start).toBe(0);
    expect(bounds.end).toBe(8); // audioClip ends at 8, midiClip at 8

    // 5. Verify timeline
    const timeline = buildEventTimeline([audioTrack, synthTrack], clips);
    expect(timeline.audioClips).toHaveLength(1);
    expect(timeline.midiClips).toHaveLength(1);

    // 6. Bounce
    const engine = createBounceEngine((duration, sampleRate) => {
      const ctx = createMockAudioContext() as unknown as Record<
        string,
        unknown
      >;
      const length = Math.ceil(duration * sampleRate);
      ctx["startRendering"] = vi.fn().mockResolvedValue({
        numberOfChannels: 2,
        length,
        sampleRate,
        duration,
        getChannelData: () => new Float32Array(length),
        copyToChannel: vi.fn(),
        copyFromChannel: vi.fn(),
      });
      ctx["sampleRate"] = sampleRate;
      ctx["destination"] = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        channelCount: 2,
      };
      return ctx as unknown as OfflineAudioContext;
    });

    const mockBuffer = {
      numberOfChannels: 2,
      length: 352800,
      sampleRate: 44100,
      duration: 8,
      getChannelData: () => new Float32Array(352800),
      copyToChannel: vi.fn(),
      copyFromChannel: vi.fn(),
    } as unknown as AudioBuffer;

    const gen = engine.bounce({
      sampleRate: 44100,
      bitDepth: 16,
      range: { type: "session" },
      tracks: [audioTrack, synthTrack],
      clips,
      automationLanes: [volumeAutomation],
      masterLevel: 1,
      getBuffer: () => mockBuffer,
      instruments: new Map(),
    });

    let iterResult: IteratorResult<BounceProgress, BounceResult>;
    do {
      iterResult = await gen.next();
    } while (iterResult.done !== true);

    expect(iterResult.value.duration).toBe(8);
    expect(iterResult.value.sampleRate).toBe(44100);
    expect(iterResult.value.blob).toBeDefined();
  });
});
