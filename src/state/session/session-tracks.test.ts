import { describe, it, expect, beforeEach } from "vitest";
import { useDawStore } from "@state/store";
import { sessionSchema, createDefaultSession } from "./session-schema";
import { hydrateStore } from "./use-session-persistence";
import type { TrackModel, AudioClipModel } from "@state/track/index";
import type { SessionSchema } from "./session-schema";

/** Helper: build a minimal track */
function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "track-1",
    name: "Audio 1",
    type: "audio",
    color: "#ff0000",
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

/** Helper: build a minimal clip */
function makeClip(overrides: Partial<AudioClipModel> = {}): AudioClipModel {
  return {
    type: "audio",
    id: "clip-1",
    trackId: "track-1",
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 4,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Clip 1",
    ...overrides,
  };
}

/**
 * Simulate storeToSession by reading from the store.
 * We import the real function indirectly by calling the internal helper.
 * Since storeToSession is not exported, we build the session the same way
 * and validate via schema.
 */
function storeToSessionForTest(): SessionSchema {
  const state = useDawStore.getState();
  const clipsArray = Object.values(state.clips);
  return {
    version: 1,
    meta: { name: "Test", createdAt: 0, updatedAt: 0 },
    transport: {
      bpm: state.bpm,
      loopEnabled: state.loopEnabled,
      loopStart: state.loopStart,
      loopEnd: state.loopEnd,
    },
    tracks: state.tracks.map((t) => ({ ...t })),
    clips: clipsArray,
    mixer: { masterVolume: 1 },
  };
}

describe("Session tracks round-trip", () => {
  beforeEach(() => {
    useDawStore.setState({
      transportState: "stopped",
      bpm: 120,
      cursorSeconds: 0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      engineStatus: "uninitialized",
      masterVolume: 1,
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
    });
  });

  it("round-trips an empty session (no tracks/clips)", () => {
    const session = storeToSessionForTest();
    const parsed = sessionSchema.parse(session);

    expect(parsed.tracks).toEqual([]);
    expect(parsed.clips).toEqual([]);

    hydrateStore(parsed);
    const state = useDawStore.getState();
    expect(state.tracks).toEqual([]);
    expect(state.clips).toEqual({});
  });

  it("round-trips a single track with no clips", () => {
    const track = makeTrack();
    useDawStore.setState({ tracks: [track] });

    const session = storeToSessionForTest();
    const parsed = sessionSchema.parse(session);

    expect(parsed.tracks).toHaveLength(1);
    expect(parsed.tracks[0].id).toBe("track-1");
    expect(parsed.tracks[0].name).toBe("Audio 1");

    // Reset and hydrate
    useDawStore.setState({ tracks: [], clips: {} });
    hydrateStore(parsed);

    const state = useDawStore.getState();
    expect(state.tracks).toHaveLength(1);
    expect(state.tracks[0].id).toBe("track-1");
  });

  it("round-trips tracks with clips", () => {
    const clip1 = makeClip({ id: "clip-1", trackId: "track-1" });
    const clip2 = makeClip({
      id: "clip-2",
      trackId: "track-1",
      startTime: 4,
      name: "Clip 2",
    });
    const track = makeTrack({ clipIds: ["clip-1", "clip-2"] });

    useDawStore.setState({
      tracks: [track],
      clips: { "clip-1": clip1, "clip-2": clip2 },
    });

    const session = storeToSessionForTest();
    const parsed = sessionSchema.parse(session);

    expect(parsed.tracks).toHaveLength(1);
    expect(parsed.clips).toHaveLength(2);

    // Reset and hydrate
    useDawStore.setState({ tracks: [], clips: {} });
    hydrateStore(parsed);

    const state = useDawStore.getState();
    expect(state.tracks).toHaveLength(1);
    expect(state.tracks[0].clipIds).toEqual(["clip-1", "clip-2"]);
    expect(Object.keys(state.clips)).toHaveLength(2);
    expect(state.clips["clip-1"].name).toBe("Clip 1");
    expect(state.clips["clip-2"].startTime).toBe(4);
  });

  it("round-trips multiple tracks", () => {
    const t1 = makeTrack({ id: "t1", name: "Guitar", type: "audio" });
    const t2 = makeTrack({
      id: "t2",
      name: "Synth",
      type: "instrument",
      color: "#00ff00",
    });

    useDawStore.setState({ tracks: [t1, t2] });

    const session = storeToSessionForTest();
    const parsed = sessionSchema.parse(session);

    expect(parsed.tracks).toHaveLength(2);

    useDawStore.setState({ tracks: [], clips: {} });
    hydrateStore(parsed);

    const state = useDawStore.getState();
    expect(state.tracks).toHaveLength(2);
    expect(state.tracks[0].name).toBe("Guitar");
    expect(state.tracks[1].type).toBe("instrument");
  });

  it("preserves track properties through round-trip", () => {
    const track = makeTrack({
      muted: true,
      solo: true,
      armed: true,
      volume: 0.5,
      pan: -0.75,
    });
    useDawStore.setState({ tracks: [track] });

    const session = storeToSessionForTest();
    const parsed = sessionSchema.parse(session);

    useDawStore.setState({ tracks: [], clips: {} });
    hydrateStore(parsed);

    const restored = useDawStore.getState().tracks[0];
    expect(restored.muted).toBe(true);
    expect(restored.solo).toBe(true);
    expect(restored.armed).toBe(true);
    expect(restored.volume).toBe(0.5);
    expect(restored.pan).toBe(-0.75);
  });

  it("preserves clip properties through round-trip", () => {
    const clip = makeClip({
      sourceOffset: 2.5,
      gain: 0.8,
      fadeIn: 0.1,
      fadeOut: 0.3,
    });
    const track = makeTrack({ clipIds: ["clip-1"] });

    useDawStore.setState({ tracks: [track], clips: { "clip-1": clip } });

    const session = storeToSessionForTest();
    const parsed = sessionSchema.parse(session);

    useDawStore.setState({ tracks: [], clips: {} });
    hydrateStore(parsed);

    const restored = useDawStore.getState().clips["clip-1"];
    expect(restored.sourceOffset).toBe(2.5);
    expect(restored.gain).toBe(0.8);
    expect(restored.fadeIn).toBe(0.1);
    expect(restored.fadeOut).toBe(0.3);
  });

  it("schema rejects invalid track data", () => {
    const session = createDefaultSession();
    const bad = {
      ...session,
      tracks: [{ id: 123 }], // id should be string
      clips: [],
    };
    const result = sessionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("schema rejects invalid clip data", () => {
    const session = createDefaultSession();
    const bad = {
      ...session,
      clips: [{ id: "c1", startTime: -5 }], // startTime min 0, missing fields
    };
    const result = sessionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("converts clips Record to array and back", () => {
    const clip = makeClip();
    const track = makeTrack({ clipIds: ["clip-1"] });

    useDawStore.setState({ tracks: [track], clips: { "clip-1": clip } });

    const session = storeToSessionForTest();
    // clips in session should be an array
    expect(Array.isArray(session.clips)).toBe(true);

    const parsed = sessionSchema.parse(session);
    hydrateStore(parsed);

    // clips in store should be a Record
    const state = useDawStore.getState();
    expect(typeof state.clips).toBe("object");
    expect(Array.isArray(state.clips)).toBe(false);
    expect(state.clips["clip-1"].id).toBe("clip-1");
  });
});
