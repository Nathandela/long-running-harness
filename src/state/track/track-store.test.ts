import { describe, it, expect, beforeEach } from "vitest";
import { useDawStore } from "@state/store";
import type { ClipModel, TrackModel } from "./types";

function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "track-1",
    name: "Track 1",
    type: "audio",
    color: "#ff2d6f",
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

function makeClip(overrides: Partial<ClipModel> = {}): ClipModel {
  return {
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

/** Safe track access that fails the test if track is missing. */
function getTrack(index: number): TrackModel {
  const track = useDawStore.getState().tracks[index];
  expect(track).toBeDefined();
  return track as TrackModel;
}

/** Safe clip access that fails the test if clip is missing. */
function getClip(id: string): ClipModel {
  const clip = useDawStore.getState().clips[id];
  expect(clip).toBeDefined();
  return clip as ClipModel;
}

describe("Track store", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
    });
  });

  describe("addTrack", () => {
    it("adds a track to the store", () => {
      const track = makeTrack();
      useDawStore.getState().addTrack(track);
      expect(useDawStore.getState().tracks).toHaveLength(1);
      expect(useDawStore.getState().tracks[0]).toEqual(track);
    });

    it("adds multiple tracks in order", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1", name: "T1" }));
      useDawStore.getState().addTrack(makeTrack({ id: "t2", name: "T2" }));
      const { tracks } = useDawStore.getState();
      expect(tracks).toHaveLength(2);
      expect(getTrack(0).id).toBe("t1");
      expect(getTrack(1).id).toBe("t2");
    });

    it("adds track at specific index", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addTrack(makeTrack({ id: "t3" }));
      useDawStore.getState().addTrack(makeTrack({ id: "t2" }), 1);
      const ids = useDawStore.getState().tracks.map((t) => t.id);
      expect(ids).toEqual(["t1", "t2", "t3"]);
    });
  });

  describe("removeTrack", () => {
    it("removes a track and its clips", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addClip(makeClip({ id: "c1", trackId: "t1" }));
      useDawStore.getState().removeTrack("t1");
      expect(useDawStore.getState().tracks).toHaveLength(0);
      expect(useDawStore.getState().clips["c1"]).toBeUndefined();
    });

    it("no-ops for unknown track id", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().removeTrack("unknown");
      expect(useDawStore.getState().tracks).toHaveLength(1);
    });
  });

  describe("updateTrack", () => {
    it("updates track fields", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore
        .getState()
        .updateTrack("t1", { name: "Renamed", muted: true });
      const track = getTrack(0);
      expect(track.name).toBe("Renamed");
      expect(track.muted).toBe(true);
    });
  });

  describe("reorderTrack", () => {
    it("moves a track to a new position", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addTrack(makeTrack({ id: "t2" }));
      useDawStore.getState().addTrack(makeTrack({ id: "t3" }));
      useDawStore.getState().reorderTrack("t3", 0);
      const ids = useDawStore.getState().tracks.map((t) => t.id);
      expect(ids).toEqual(["t3", "t1", "t2"]);
    });
  });

  describe("addClip", () => {
    it("adds a clip to the clips map and track clipIds", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addClip(makeClip({ id: "c1", trackId: "t1" }));
      expect(useDawStore.getState().clips["c1"]).toBeDefined();
      expect(getTrack(0).clipIds).toContain("c1");
    });
  });

  describe("removeClip", () => {
    it("removes a clip from map and track clipIds", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addClip(makeClip({ id: "c1", trackId: "t1" }));
      useDawStore.getState().removeClip("c1");
      expect(useDawStore.getState().clips["c1"]).toBeUndefined();
      expect(getTrack(0).clipIds).not.toContain("c1");
    });
  });

  describe("moveClip", () => {
    it("changes clip startTime", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore
        .getState()
        .addClip(makeClip({ id: "c1", trackId: "t1", startTime: 0 }));
      useDawStore.getState().moveClip("c1", 5.0);
      expect(getClip("c1").startTime).toBe(5.0);
    });

    it("moves clip to a different track", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addTrack(makeTrack({ id: "t2" }));
      useDawStore
        .getState()
        .addClip(makeClip({ id: "c1", trackId: "t1", startTime: 0 }));
      useDawStore.getState().moveClip("c1", 2.0, "t2");
      const clip = getClip("c1");
      expect(clip.trackId).toBe("t2");
      expect(clip.startTime).toBe(2.0);
      expect(getTrack(0).clipIds).not.toContain("c1");
      expect(getTrack(1).clipIds).toContain("c1");
    });
  });

  describe("splitClip", () => {
    it("splits a clip at a given time", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      const newId = useDawStore.getState().splitClip("c1", 5);
      expect(newId).toBeDefined();

      const left = getClip("c1");
      const right = getClip(newId as string);

      // Left clip: startTime=2, duration=3 (5-2)
      expect(left.startTime).toBe(2);
      expect(left.duration).toBe(3);
      expect(left.sourceOffset).toBe(0);

      // Right clip: startTime=5, duration=3 (6-3), sourceOffset=3
      expect(right.startTime).toBe(5);
      expect(right.duration).toBe(3);
      expect(right.sourceOffset).toBe(3);
      expect(right.trackId).toBe("t1");
    });

    it("returns undefined if split point is outside clip", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          duration: 4,
        }),
      );
      expect(useDawStore.getState().splitClip("c1", 10)).toBeUndefined();
      expect(useDawStore.getState().splitClip("c1", 1)).toBeUndefined();
    });
  });

  describe("trimClip", () => {
    it("trims clip start (moves startTime forward, adjusts sourceOffset)", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      useDawStore.getState().trimClip("c1", 4, undefined);
      const clip = getClip("c1");
      expect(clip.startTime).toBe(4);
      expect(clip.sourceOffset).toBe(2);
      expect(clip.duration).toBe(4);
    });

    it("trims clip end", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore.getState().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      useDawStore.getState().trimClip("c1", undefined, 5);
      const clip = getClip("c1");
      expect(clip.startTime).toBe(2);
      expect(clip.duration).toBe(3);
    });
  });

  describe("duplicateClip", () => {
    it("creates a new clip placed right after the original", () => {
      useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
      useDawStore
        .getState()
        .addClip(
          makeClip({ id: "c1", trackId: "t1", startTime: 2, duration: 4 }),
        );
      const newId = useDawStore.getState().duplicateClip("c1");
      expect(newId).toBeDefined();
      const dup = getClip(newId as string);
      expect(dup.startTime).toBe(6); // 2 + 4
      expect(dup.duration).toBe(4);
      expect(dup.sourceId).toBe("source-1");
      expect(dup.trackId).toBe("t1");
    });
  });

  describe("selection", () => {
    it("selects and deselects tracks", () => {
      useDawStore.getState().setSelectedTrackIds(["t1", "t2"]);
      expect(useDawStore.getState().selectedTrackIds).toEqual(["t1", "t2"]);
      useDawStore.getState().setSelectedTrackIds([]);
      expect(useDawStore.getState().selectedTrackIds).toEqual([]);
    });

    it("selects and deselects clips", () => {
      useDawStore.getState().setSelectedClipIds(["c1"]);
      expect(useDawStore.getState().selectedClipIds).toEqual(["c1"]);
    });
  });
});

describe("arrangementQuery", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
    });
  });

  it("returns clips that overlap a given time", () => {
    useDawStore.getState().addTrack(makeTrack({ id: "t1" }));
    useDawStore
      .getState()
      .addClip(
        makeClip({ id: "c1", trackId: "t1", startTime: 2, duration: 4 }),
      );
    useDawStore
      .getState()
      .addClip(
        makeClip({ id: "c2", trackId: "t1", startTime: 8, duration: 2 }),
      );

    const { queryClipsAtTime } = useDawStore.getState();
    const atTime3 = queryClipsAtTime(3);
    expect(atTime3).toHaveLength(1);
    expect(atTime3[0]).toHaveProperty("id", "c1");

    const atTime9 = queryClipsAtTime(9);
    expect(atTime9).toHaveLength(1);
    expect(atTime9[0]).toHaveProperty("id", "c2");

    const atTime7 = queryClipsAtTime(7);
    expect(atTime7).toHaveLength(0);
  });

  it("skips clips on muted tracks", () => {
    useDawStore.getState().addTrack(makeTrack({ id: "t1", muted: true }));
    useDawStore
      .getState()
      .addClip(
        makeClip({ id: "c1", trackId: "t1", startTime: 0, duration: 10 }),
      );
    const result = useDawStore.getState().queryClipsAtTime(5);
    expect(result).toHaveLength(0);
  });

  it("respects solo mode (only solo tracks play)", () => {
    useDawStore.getState().addTrack(makeTrack({ id: "t1", solo: false }));
    useDawStore.getState().addTrack(makeTrack({ id: "t2", solo: true }));
    useDawStore
      .getState()
      .addClip(
        makeClip({ id: "c1", trackId: "t1", startTime: 0, duration: 10 }),
      );
    useDawStore
      .getState()
      .addClip(
        makeClip({ id: "c2", trackId: "t2", startTime: 0, duration: 10 }),
      );
    const result = useDawStore.getState().queryClipsAtTime(5);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("id", "c2");
  });
});
