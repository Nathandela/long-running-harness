/**
 * Shared test helpers for integration tests.
 * Provides mock AudioContext and factory functions for building
 * test data across multiple module boundaries.
 */

import { vi } from "vitest";
import type {
  TrackModel,
  AudioClipModel,
  MidiClipModel,
  MIDINoteEvent,
} from "@state/track/types";
import type {
  AutomationLane,
  AutomationPoint,
} from "@audio/automation/automation-types";
import type { EffectSlotState } from "@state/effects/types";
import type { ModRoute } from "@audio/synth/modulation-types";

// ─── Mock AudioContext ───

type MockAudioParam = {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
};

function createMockParam(initial = 0): MockAudioParam {
  const param: MockAudioParam = {
    value: initial,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
  // Wire up value tracking
  param.setValueAtTime.mockImplementation((v: number) => {
    param.value = v;
  });
  param.linearRampToValueAtTime.mockImplementation((v: number) => {
    param.value = v;
  });
  param.exponentialRampToValueAtTime.mockImplementation((v: number) => {
    param.value = v;
  });
  return param;
}

type MockGainNode = {
  gain: MockAudioParam;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  channelCount: number;
};

type MockAnalyserNode = {
  fftSize: number;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  getByteFrequencyData: ReturnType<typeof vi.fn>;
  getByteTimeDomainData: ReturnType<typeof vi.fn>;
  getFloatTimeDomainData: ReturnType<typeof vi.fn>;
};

export function createMockAudioContext(initialTime = 0): AudioContext {
  let _currentTime = initialTime;

  const mockGainNode = (): MockGainNode => ({
    gain: createMockParam(1),
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    channelCount: 2,
  });

  const mockPanner = (): object => ({
    pan: createMockParam(0),
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockAnalyser = (): MockAnalyserNode => ({
    fftSize: 2048,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  });

  const mockCompressor = (): object => ({
    threshold: createMockParam(-24),
    ratio: createMockParam(12),
    knee: createMockParam(30),
    attack: createMockParam(0.003),
    release: createMockParam(0.25),
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockBufferSource = (): object => ({
    buffer: null,
    playbackRate: createMockParam(1),
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  });

  const ctx = {
    get currentTime(): number {
      return _currentTime;
    },
    sampleRate: 44100,
    state: "running" as AudioContextState,
    destination: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      channelCount: 2,
    },
    createGain: mockGainNode,
    createStereoPanner: mockPanner,
    createAnalyser: mockAnalyser,
    createDynamicsCompressor: mockCompressor,
    createBufferSource: mockBufferSource,
    createBuffer(
      channels: number,
      length: number,
      sampleRate: number,
    ): AudioBuffer {
      const channelData: Float32Array[] = [];
      for (let i = 0; i < channels; i++) {
        channelData.push(new Float32Array(length));
      }
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData(c: number): Float32Array {
          const data = channelData[c];
          if (data === undefined) throw new Error(`No channel ${String(c)}`);
          return data;
        },
        copyToChannel(source: Float32Array, c: number): void {
          const data = channelData[c];
          if (data === undefined) throw new Error(`No channel ${String(c)}`);
          data.set(source);
        },
        copyFromChannel: vi.fn(),
      } as unknown as AudioBuffer;
    },
    audioWorklet: {
      addModule: vi.fn().mockResolvedValue(undefined),
    },
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    _advanceTime(seconds: number): void {
      _currentTime += seconds;
    },
  };

  return ctx as unknown as AudioContext;
}

/** Advance the mock AudioContext's currentTime */
export function advanceTime(ctx: AudioContext, seconds: number): void {
  (ctx as unknown as { _advanceTime: (s: number) => void })._advanceTime(
    seconds,
  );
}

// ─── Factory Functions ───

let idCounter = 0;

export function resetIdCounter(): void {
  idCounter = 0;
}

function nextId(prefix: string): string {
  return `${prefix}-${String(++idCounter)}`;
}

export function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: nextId("track"),
    name: "Test Track",
    type: "audio",
    color: "#FF5733",
    muted: false,
    solo: false,
    armed: false,
    soloIsolate: false,
    volume: 1,
    pan: 0,
    clipIds: [],
    ...overrides,
  };
}

export function makeAudioClip(
  overrides: Partial<AudioClipModel> = {},
): AudioClipModel {
  return {
    type: "audio",
    id: nextId("clip"),
    trackId: "track-1",
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 2,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Test Clip",
    ...overrides,
  };
}

export function makeMidiClip(
  overrides: Partial<MidiClipModel> = {},
): MidiClipModel {
  return {
    type: "midi",
    id: nextId("clip"),
    trackId: "track-1",
    startTime: 0,
    duration: 4,
    noteEvents: [],
    name: "MIDI Clip",
    ...overrides,
  };
}

export function makeNoteEvent(
  overrides: Partial<MIDINoteEvent> = {},
): MIDINoteEvent {
  return {
    id: nextId("note"),
    pitch: 60,
    velocity: 100,
    startTime: 0,
    duration: 0.5,
    ...overrides,
  };
}

export function makeAutomationLane(
  overrides: Partial<AutomationLane> = {},
): AutomationLane {
  return {
    id: nextId("lane"),
    trackId: "track-1",
    target: { type: "mixer", param: "volume" },
    points: [],
    mode: "read",
    armed: true,
    ...overrides,
  };
}

export function makeAutomationPoint(
  overrides: Partial<AutomationPoint> = {},
): AutomationPoint {
  return {
    id: nextId("pt"),
    time: 0,
    value: 0.5,
    interpolation: "linear",
    curve: 0,
    ...overrides,
  };
}

export function makeEffectSlot(
  overrides: Partial<EffectSlotState> = {},
): EffectSlotState {
  return {
    id: nextId("fx"),
    typeId: "delay",
    bypassed: false,
    params: { time: 0.3, feedback: 0.4, mix: 0.5 },
    ...overrides,
  };
}

export function makeModRoute(overrides: Partial<ModRoute> = {}): ModRoute {
  return {
    id: nextId("mod"),
    source: "lfo1",
    destination: "filterCutoff",
    amount: 0.5,
    bipolar: true,
    ...overrides,
  };
}
