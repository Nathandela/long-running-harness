/**
 * Tests for the bounce engine.
 * Tests core logic: session duration, event scheduling, progress, cancellation.
 * Uses mock OfflineAudioContext since jsdom doesn't provide one.
 */

import { describe, it, expect, vi } from "vitest";
import {
  computeSessionBounds,
  buildEventTimeline,
  createBounceEngine,
} from "./bounce-engine";
import type {
  AudioClipModel,
  MidiClipModel,
  TrackModel,
} from "@state/track/types";
import type { BounceOptions, BounceProgress, BounceResult } from "./types";

// ─── Test helpers ───

/** Drain an async generator, collecting the return value */
async function drainGenerator(
  gen: AsyncGenerator<BounceProgress, BounceResult>,
  onYield?: (value: BounceProgress) => void,
): Promise<BounceResult> {
  for (;;) {
    const next = await gen.next();
    if (next.done === true) return next.value;
    onYield?.(next.value);
  }
}

function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "track-1",
    name: "Track 1",
    type: "audio",
    color: "#ff0000",
    muted: false,
    solo: false,
    armed: false,
    soloIsolate: false,
    volume: 1,
    pan: 0,
    clipIds: ["clip-1"],
    ...overrides,
  };
}

function makeAudioClip(
  overrides: Partial<AudioClipModel> = {},
): AudioClipModel {
  return {
    type: "audio",
    id: "clip-1",
    trackId: "track-1",
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 5,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Clip 1",
    ...overrides,
  };
}

function makeMidiClip(overrides: Partial<MidiClipModel> = {}): MidiClipModel {
  return {
    type: "midi",
    id: "midi-clip-1",
    trackId: "track-2",
    startTime: 0,
    duration: 4,
    noteEvents: [
      { id: "n1", pitch: 60, velocity: 100, startTime: 0, duration: 1 },
      { id: "n2", pitch: 64, velocity: 80, startTime: 1, duration: 1 },
    ],
    name: "MIDI Clip",
    ...overrides,
  };
}

// ─── computeSessionBounds ───

describe("computeSessionBounds", () => {
  it("computes bounds from audio clips", () => {
    const clips = {
      "clip-1": makeAudioClip({ startTime: 2, duration: 5 }),
      "clip-2": makeAudioClip({ id: "clip-2", startTime: 10, duration: 3 }),
    };
    const tracks = [makeTrack({ clipIds: ["clip-1", "clip-2"] })];

    const bounds = computeSessionBounds(tracks, clips);
    expect(bounds.start).toBe(2);
    expect(bounds.end).toBe(13); // 10 + 3
  });

  it("includes MIDI clip bounds", () => {
    const clips = {
      "midi-1": makeMidiClip({ id: "midi-1", startTime: 1, duration: 4 }),
    };
    const tracks = [
      makeTrack({ id: "track-2", type: "instrument", clipIds: ["midi-1"] }),
    ];

    const bounds = computeSessionBounds(tracks, clips);
    expect(bounds.start).toBe(1);
    expect(bounds.end).toBe(5);
  });

  it("excludes muted tracks", () => {
    const clips = {
      "clip-1": makeAudioClip({ startTime: 0, duration: 10 }),
      "clip-2": makeAudioClip({
        id: "clip-2",
        trackId: "track-2",
        startTime: 0,
        duration: 20,
      }),
    };
    const tracks = [
      makeTrack({ clipIds: ["clip-1"] }),
      makeTrack({ id: "track-2", clipIds: ["clip-2"], muted: true }),
    ];

    const bounds = computeSessionBounds(tracks, clips);
    expect(bounds.end).toBe(10); // Muted track excluded
  });

  it("returns zero bounds for empty session", () => {
    const bounds = computeSessionBounds([], {});
    expect(bounds.start).toBe(0);
    expect(bounds.end).toBe(0);
  });

  it("handles solo: only includes soloed tracks", () => {
    const clips = {
      "clip-1": makeAudioClip({ startTime: 0, duration: 5 }),
      "clip-2": makeAudioClip({
        id: "clip-2",
        trackId: "track-2",
        startTime: 0,
        duration: 20,
      }),
    };
    const tracks = [
      makeTrack({ clipIds: ["clip-1"], solo: true }),
      makeTrack({ id: "track-2", clipIds: ["clip-2"] }),
    ];

    const bounds = computeSessionBounds(tracks, clips);
    expect(bounds.end).toBe(5); // Only soloed track
  });
});

// ─── buildEventTimeline ───

describe("buildEventTimeline", () => {
  it("collects audio clips for non-muted tracks", () => {
    const clips = {
      "clip-1": makeAudioClip(),
    };
    const tracks = [makeTrack()];
    const timeline = buildEventTimeline(tracks, clips);

    expect(timeline.audioClips.length).toBe(1);
    expect(timeline.audioClips[0]?.clip.id).toBe("clip-1");
  });

  it("excludes clips from muted tracks", () => {
    const clips = {
      "clip-1": makeAudioClip(),
    };
    const tracks = [makeTrack({ muted: true })];
    const timeline = buildEventTimeline(tracks, clips);

    expect(timeline.audioClips.length).toBe(0);
  });

  it("collects MIDI clips separately", () => {
    const clips = {
      "midi-1": makeMidiClip({ id: "midi-1" }),
    };
    const tracks = [
      makeTrack({ id: "track-2", type: "instrument", clipIds: ["midi-1"] }),
    ];
    const timeline = buildEventTimeline(tracks, clips);

    expect(timeline.midiClips.length).toBe(1);
    expect(timeline.midiClips[0]?.clip.id).toBe("midi-1");
  });

  it("handles solo-in-place: only audible tracks included", () => {
    const clips = {
      "clip-1": makeAudioClip(),
      "clip-2": makeAudioClip({ id: "clip-2", trackId: "track-2" }),
    };
    const tracks = [
      makeTrack({ solo: true, clipIds: ["clip-1"] }),
      makeTrack({ id: "track-2", clipIds: ["clip-2"] }),
    ];
    const timeline = buildEventTimeline(tracks, clips);

    expect(timeline.audioClips.length).toBe(1);
    expect(timeline.audioClips[0]?.clip.trackId).toBe("track-1");
  });
});

// ─── BounceEngine (integration with mocks) ───

describe("createBounceEngine", () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function createMockOfflineAudioContext(duration: number, sampleRate: number) {
    const numSamples = Math.ceil(duration * sampleRate);
    const renderedBuffer = {
      numberOfChannels: 2,
      length: numSamples,
      sampleRate,
      duration,
      getChannelData(ch: number): Float32Array {
        const data = new Float32Array(numSamples);
        if (ch === 0) {
          for (let i = 0; i < numSamples; i++) {
            data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
          }
        }
        return data;
      },
    };

    return {
      sampleRate,
      length: numSamples,
      destination: { connect: vi.fn(), disconnect: vi.fn() },
      createGain: vi.fn().mockImplementation(() => ({
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
        },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
      })),
      createAnalyser: vi.fn().mockImplementation(() => ({
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
        fftSize: 2048,
      })),
      createStereoPanner: vi.fn().mockImplementation(() => ({
        pan: { value: 0 },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
      })),
      createDynamicsCompressor: vi.fn().mockImplementation(() => ({
        threshold: { value: -1 },
        ratio: { value: 20 },
        knee: { value: 0 },
        attack: { value: 0.001 },
        release: { value: 0.01 },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
      })),
      createBufferSource: vi.fn().mockImplementation(() => ({
        buffer: null as unknown,
        playbackRate: { value: 1, setValueAtTime: vi.fn() },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
      })),
      createBiquadFilter: vi.fn().mockImplementation(() => ({
        type: "lowpass",
        frequency: { value: 350, setValueAtTime: vi.fn() },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
      })),
      createBuffer: vi
        .fn()
        .mockImplementation((_ch: number, len: number, sr: number) => ({
          numberOfChannels: 2,
          length: len,
          sampleRate: sr,
          getChannelData: (): Float32Array => new Float32Array(len),
          copyToChannel: vi.fn(),
        })),
      startRendering: vi.fn().mockResolvedValue(renderedBuffer),
      suspend: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn(),
    };
  }

  it("yields progress updates during bounce", async () => {
    const clips = { "clip-1": makeAudioClip({ duration: 2 }) };
    const tracks = [makeTrack()];
    const mockBuffer = {
      numberOfChannels: 1,
      length: 44100,
      sampleRate: 44100,
      getChannelData: (): Float32Array => new Float32Array(44100),
    };

    const options: BounceOptions = {
      sampleRate: 44100,
      bitDepth: 16,
      range: { type: "full" },
      tracks,
      clips,
      automationLanes: [],
      masterLevel: 1,
      getBuffer: () => mockBuffer as unknown as AudioBuffer,
      instruments: new Map(),
    };

    const engine = createBounceEngine(
      (dur, sr) =>
        createMockOfflineAudioContext(
          dur,
          sr,
        ) as unknown as OfflineAudioContext,
    );

    const progress: string[] = [];
    const gen = engine.bounce(options);
    const result = await drainGenerator(gen, (p) => progress.push(p.phase));

    expect(progress).toContain("preparing");
    expect(progress).toContain("encoding");
    expect(result.blob.type).toBe("audio/wav");
  });

  it("respects region range selection", async () => {
    const clips = {
      "clip-1": makeAudioClip({ startTime: 0, duration: 10 }),
    };
    const tracks = [makeTrack()];
    const mockBuffer = {
      numberOfChannels: 1,
      length: 44100,
      sampleRate: 44100,
      getChannelData: (): Float32Array => new Float32Array(44100),
    };

    const options: BounceOptions = {
      sampleRate: 44100,
      bitDepth: 16,
      range: { type: "region", start: 2, end: 5 },
      tracks,
      clips,
      automationLanes: [],
      masterLevel: 1,
      getBuffer: () => mockBuffer as unknown as AudioBuffer,
      instruments: new Map(),
    };

    const engine = createBounceEngine(
      (dur, sr) =>
        createMockOfflineAudioContext(
          dur,
          sr,
        ) as unknown as OfflineAudioContext,
    );

    const result = await drainGenerator(engine.bounce(options));

    // Duration should be 3 seconds (5 - 2)
    expect(result.duration).toBe(3);
  });

  it("can be cancelled mid-bounce", async () => {
    const clips = { "clip-1": makeAudioClip({ duration: 60 }) };
    const tracks = [makeTrack()];
    const mockBuffer = {
      numberOfChannels: 1,
      length: 44100,
      sampleRate: 44100,
      getChannelData: (): Float32Array => new Float32Array(44100),
    };

    const options: BounceOptions = {
      sampleRate: 44100,
      bitDepth: 16,
      range: { type: "full" },
      tracks,
      clips,
      automationLanes: [],
      masterLevel: 1,
      getBuffer: () => mockBuffer as unknown as AudioBuffer,
      instruments: new Map(),
    };

    const engine = createBounceEngine(
      (dur, sr) =>
        createMockOfflineAudioContext(
          dur,
          sr,
        ) as unknown as OfflineAudioContext,
    );

    const gen = engine.bounce(options);

    // Get first progress update
    const first = await gen.next();
    expect(first.done === true).toBe(false);

    // Cancel after first progress
    engine.cancel();

    const result = await drainGenerator(gen);

    // Cancellation should produce an empty blob
    expect(result.blob.size).toBe(0);
  });
});
