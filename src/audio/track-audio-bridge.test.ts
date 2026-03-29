/**
 * Tests for TrackAudioBridge — the bridge between track store changes
 * and live WebAudio instrument/kit instances.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useDawStore } from "@state/store";
import { useSynthStore } from "@state/synth/synth-store";
import { createMockAudioContext, makeTrack } from "../test/integration/helpers";
import { createMixerEngine } from "@audio/mixer";
import type { SynthInstrument } from "./synth/synth-instrument";

// Mock createSynthInstrument — AudioWorkletNode doesn't exist in jsdom
const mockInstrumentFactory = vi.fn<[AudioContext], Promise<SynthInstrument>>();

vi.mock("./synth/synth-instrument", () => ({
  createSynthInstrument: (...args: [AudioContext]) =>
    mockInstrumentFactory(...args),
}));

// Mock subscribeModRoutes to avoid modulation store coupling
const mockUnsubMod = vi.fn();
vi.mock("./synth/modulation-bridge", () => ({
  subscribeModRoutes: vi.fn(() => mockUnsubMod),
}));

// Mock drum synthesis — OfflineAudioContext is not available in jsdom
vi.mock("./drum-machine/drum-synthesis", () => ({
  synthesize808Samples: vi.fn((ctx: AudioContext) =>
    Promise.resolve(
      new Map([
        ["bd", ctx.createBuffer(1, 4410, 44100)],
        ["sd", ctx.createBuffer(1, 4410, 44100)],
        ["ch", ctx.createBuffer(1, 4410, 44100)],
        ["oh", ctx.createBuffer(1, 4410, 44100)],
        ["cp", ctx.createBuffer(1, 4410, 44100)],
        ["lt", ctx.createBuffer(1, 4410, 44100)],
        ["mt", ctx.createBuffer(1, 4410, 44100)],
        ["ht", ctx.createBuffer(1, 4410, 44100)],
        ["rs", ctx.createBuffer(1, 4410, 44100)],
        ["cb", ctx.createBuffer(1, 4410, 44100)],
        ["cy", ctx.createBuffer(1, 4410, 44100)],
      ]),
    ),
  ),
}));

function createMockInstrument(): SynthInstrument {
  return {
    output: {} as AudioNode,
    params: {} as SynthInstrument["params"],
    noteOn: vi.fn(),
    noteOff: vi.fn(),
    allNotesOff: vi.fn(),
    setParam: vi.fn(),
    setModRoutes: vi.fn(),
    setModSource: vi.fn(),
    connectToMixer: vi.fn(),
    disconnectFromMixer: vi.fn(),
    dispose: vi.fn(),
  };
}

// Lazy import after mocks are set up
const { createTrackAudioBridge, _resetSampleCache } =
  await import("./track-audio-bridge");

describe("createTrackAudioBridge", () => {
  let ctx: AudioContext;
  let mixer: ReturnType<typeof createMixerEngine>;
  let bridge: ReturnType<typeof createTrackAudioBridge>;

  beforeEach(() => {
    ctx = createMockAudioContext();
    mixer = createMixerEngine(ctx);

    // Reset stores and caches
    useDawStore.setState({ tracks: [], clips: {} });
    useSynthStore.setState({ synths: {} });
    _resetSampleCache();

    // Default: factory returns a mock instrument
    const inst = createMockInstrument();
    mockInstrumentFactory.mockResolvedValue(inst);
  });

  afterEach(() => {
    bridge.dispose();
    mixer.dispose();
    vi.clearAllMocks();
  });

  it("creates synth instrument when instrument track is added", async () => {
    bridge = createTrackAudioBridge(ctx, mixer);

    const track = makeTrack({ id: "t1", type: "instrument" });
    useDawStore.getState().addTrack(track);

    await vi.waitFor(() => {
      expect(bridge.getInstrument("t1")).toBeDefined();
    });

    const inst = bridge.getInstrument("t1");
    expect(inst).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/unbound-method
    expect(inst!.connectToMixer).toHaveBeenCalledWith(mixer, "t1");
  });

  it("creates drum kit when drum track is added", async () => {
    bridge = createTrackAudioBridge(ctx, mixer);

    const track = makeTrack({ id: "t2", type: "drum" });
    useDawStore.getState().addTrack(track);

    await vi.waitFor(() => {
      expect(bridge.getDrumKit("t2")).toBeDefined();
    });
  });

  it("creates mixer strip for audio track", () => {
    bridge = createTrackAudioBridge(ctx, mixer);

    const track = makeTrack({ id: "t3", type: "audio" });
    useDawStore.getState().addTrack(track);

    expect(mixer.getStrip("t3")).toBeDefined();
  });

  it("disposes synth instrument when track is removed", async () => {
    bridge = createTrackAudioBridge(ctx, mixer);

    const track = makeTrack({ id: "t1", type: "instrument" });
    useDawStore.getState().addTrack(track);

    await vi.waitFor(() => {
      expect(bridge.getInstrument("t1")).toBeDefined();
    });

    const inst = bridge.getInstrument("t1");
    expect(inst).toBeDefined();
    useDawStore.getState().removeTrack("t1");

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/unbound-method
    expect(inst!.dispose).toHaveBeenCalled();
    expect(bridge.getInstrument("t1")).toBeUndefined();
  });

  it("disposes drum kit when track is removed", async () => {
    bridge = createTrackAudioBridge(ctx, mixer);

    const track = makeTrack({ id: "t2", type: "drum" });
    useDawStore.getState().addTrack(track);

    await vi.waitFor(() => {
      expect(bridge.getDrumKit("t2")).toBeDefined();
    });

    useDawStore.getState().removeTrack("t2");
    expect(bridge.getDrumKit("t2")).toBeUndefined();
  });

  it("forwards synth param changes to instrument", async () => {
    bridge = createTrackAudioBridge(ctx, mixer);

    const track = makeTrack({ id: "t1", type: "instrument" });
    useDawStore.getState().addTrack(track);

    await vi.waitFor(() => {
      expect(bridge.getInstrument("t1")).toBeDefined();
    });

    const inst = bridge.getInstrument("t1");
    expect(inst).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (inst!.setParam as ReturnType<typeof vi.fn>).mockClear();

    useSynthStore.getState().setParam("t1", "filterCutoff", 2000);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/unbound-method
    expect(inst!.setParam).toHaveBeenCalledWith("filterCutoff", 2000);
  });

  it("disposes instrument that finishes loading after track removed", async () => {
    let resolveInstrument!: (inst: SynthInstrument) => void;
    mockInstrumentFactory.mockReturnValue(
      new Promise((r) => {
        resolveInstrument = r;
      }),
    );

    bridge = createTrackAudioBridge(ctx, mixer);

    const track = makeTrack({ id: "t1", type: "instrument" });
    useDawStore.getState().addTrack(track);

    // Remove track before instrument finishes loading
    useDawStore.getState().removeTrack("t1");

    // Now resolve the instrument
    const inst = createMockInstrument();
    resolveInstrument(inst);
    await Promise.resolve();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(inst.dispose).toHaveBeenCalled();
    expect(bridge.getInstrument("t1")).toBeUndefined();
  });

  it("handles existing tracks on creation", async () => {
    const track = makeTrack({ id: "t1", type: "instrument" });
    useDawStore.getState().addTrack(track);

    bridge = createTrackAudioBridge(ctx, mixer);

    await vi.waitFor(() => {
      expect(bridge.getInstrument("t1")).toBeDefined();
    });
  });

  it("dispose cleans up all instruments and kits", async () => {
    bridge = createTrackAudioBridge(ctx, mixer);

    useDawStore
      .getState()
      .addTrack(makeTrack({ id: "t1", type: "instrument" }));
    useDawStore.getState().addTrack(makeTrack({ id: "t2", type: "drum" }));

    await vi.waitFor(() => {
      expect(bridge.getInstrument("t1")).toBeDefined();
    });
    await vi.waitFor(() => {
      expect(bridge.getDrumKit("t2")).toBeDefined();
    });

    const inst = bridge.getInstrument("t1");
    expect(inst).toBeDefined();
    bridge.dispose();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/unbound-method
    expect(inst!.dispose).toHaveBeenCalled();
    expect(bridge.getInstrument("t1")).toBeUndefined();
    expect(bridge.getDrumKit("t2")).toBeUndefined();
  });
});
