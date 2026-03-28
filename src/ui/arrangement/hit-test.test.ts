import { describe, it, expect } from "vitest";
import type { TrackModel, ClipModel } from "@state/track/types";
import type { ArrangementViewState } from "./arrangement-renderer";
import { hitTest, snapToGrid, xToSeconds } from "./hit-test";

const defaultView: ArrangementViewState = {
  scrollX: 0,
  scrollY: 0,
  pixelsPerSecond: 100,
  trackHeight: 64,
  headerWidth: 160,
};

function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "t1",
    name: "Track 1",
    type: "audio",
    color: "#0066ff",
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
    id: "c1",
    trackId: "t1",
    sourceId: "src-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 2,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Clip 1",
    ...overrides,
  };
}

describe("snapToGrid", () => {
  it("snaps to quarter note grid at 120 BPM", () => {
    // secPerBeat = 0.5 at 120 BPM
    expect(snapToGrid(0.3, 120, "1/4")).toBeCloseTo(0.5);
    expect(snapToGrid(0.7, 120, "1/4")).toBeCloseTo(0.5);
    expect(snapToGrid(0.8, 120, "1/4")).toBeCloseTo(1.0);
  });

  it("snaps to eighth note grid", () => {
    // secPerBeat/2 = 0.25 at 120 BPM
    expect(snapToGrid(0.2, 120, "1/8")).toBeCloseTo(0.25);
    expect(snapToGrid(0.1, 120, "1/8")).toBeCloseTo(0.0);
  });

  it("snaps to sixteenth note grid", () => {
    // secPerBeat/4 = 0.125 at 120 BPM
    expect(snapToGrid(0.1, 120, "1/16")).toBeCloseTo(0.125);
  });

  it("snaps to bar grid", () => {
    // 4 beats * 0.5 = 2 seconds per bar at 120 BPM
    expect(snapToGrid(1.5, 120, "1-bar")).toBeCloseTo(2.0);
    expect(snapToGrid(0.5, 120, "1-bar")).toBeCloseTo(0.0);
  });
});

describe("xToSeconds", () => {
  it("converts pixel position to seconds", () => {
    // x=260, headerWidth=160, pps=100, scrollX=0
    // (260 - 160) / 100 = 1.0
    expect(xToSeconds(260, defaultView)).toBeCloseTo(1.0);
  });

  it("accounts for scrollX", () => {
    const view = { ...defaultView, scrollX: 2 };
    // (260 - 160) / 100 + 2 = 3.0
    expect(xToSeconds(260, view)).toBeCloseTo(3.0);
  });
});

describe("hitTest", () => {
  it("returns ruler hit when clicking in ruler area", () => {
    const result = hitTest(200, 10, defaultView, [], {});
    expect(result.kind).toBe("ruler");
    if (result.kind === "ruler") {
      expect(result.timeSeconds).toBeCloseTo(0.4);
    }
  });

  it("returns track-header hit when clicking in header area", () => {
    const tracks = [makeTrack({ id: "t1" })];
    const result = hitTest(80, 50, defaultView, tracks, {});
    expect(result.kind).toBe("track-header");
    if (result.kind === "track-header") {
      expect(result.trackId).toBe("t1");
      expect(result.trackIndex).toBe(0);
    }
  });

  it("returns none when clicking header with no track", () => {
    const result = hitTest(80, 500, defaultView, [], {});
    expect(result.kind).toBe("none");
  });

  it("returns clip-body hit when clicking a clip center", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    // Clip starts at x = 160 + 1*100 = 260, width = 200
    // Click at center: x = 360
    const result = hitTest(360, 50, defaultView, tracks, clips);
    expect(result.kind).toBe("clip-body");
    if (result.kind === "clip-body") {
      expect(result.clipId).toBe("c1");
    }
  });

  it("returns clip-left-edge when clicking near left edge", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    // Clip starts at x=260, click at x=263 (within 8px handle)
    const result = hitTest(263, 50, defaultView, tracks, clips);
    expect(result.kind).toBe("clip-left-edge");
  });

  it("returns clip-right-edge when clicking near right edge", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    // Clip ends at x = 260 + 200 = 460, click at x=455 (within 8px handle)
    const result = hitTest(455, 50, defaultView, tracks, clips);
    expect(result.kind).toBe("clip-right-edge");
  });

  it("returns empty-lane when clicking timeline without clip", () => {
    const tracks = [makeTrack({ id: "t1" })];
    const result = hitTest(300, 50, defaultView, tracks, {});
    expect(result.kind).toBe("empty-lane");
    if (result.kind === "empty-lane") {
      expect(result.trackId).toBe("t1");
    }
  });

  it("accounts for scrollY offset", () => {
    const tracks = [makeTrack({ id: "t1" }), makeTrack({ id: "t2" })];
    const view = { ...defaultView, scrollY: 64 };
    // With scrollY=64, track t2 (index 1) is at y = 24 + 1*64 - 64 = 24
    // Click at y=50 should hit track t2
    const result = hitTest(80, 50, view, tracks, {});
    expect(result.kind).toBe("track-header");
    if (result.kind === "track-header") {
      expect(result.trackId).toBe("t2");
    }
  });
});
