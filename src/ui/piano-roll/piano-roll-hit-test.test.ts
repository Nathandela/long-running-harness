import { describe, it, expect } from "vitest";
import type { MIDINoteEvent } from "@state/track/types";
import type { PianoRollViewState } from "./piano-roll-renderer";
import {
  xToSeconds,
  yToPitch,
  pianoRollSnapToGrid,
  pianoRollHitTest,
  lassoSelectNotes,
} from "./piano-roll-hit-test";

const defaultView: PianoRollViewState = {
  scrollX: 0,
  scrollY: 84, // C5 area
  pixelsPerSecond: 100,
  noteHeight: 16,
  keyboardWidth: 48,
};

function makeNote(overrides: Partial<MIDINoteEvent> = {}): MIDINoteEvent {
  return {
    id: "n1",
    pitch: 60,
    velocity: 100,
    startTime: 0,
    duration: 0.5,
    ...overrides,
  };
}

// Canvas dimensions for hit tests
const CANVAS_HEIGHT = 500;
const VELOCITY_LANE_HEIGHT = 60;

describe("xToSeconds", () => {
  it("converts pixel position to seconds", () => {
    // x=148, keyboardWidth=48, pps=100, scrollX=0
    // (148 - 48) / 100 = 1.0
    expect(xToSeconds(148, defaultView)).toBeCloseTo(1.0);
  });

  it("accounts for scrollX", () => {
    const view = { ...defaultView, scrollX: 2 };
    // (148 - 48) / 100 + 2 = 3.0
    expect(xToSeconds(148, view)).toBeCloseTo(3.0);
  });
});

describe("yToPitch", () => {
  it("converts pixel position to pitch", () => {
    // y = PR_RULER_HEIGHT + (scrollY - pitch) * noteHeight
    // 24 + (84 - 60) * 16 = 24 + 384 = 408
    // So yToPitch(408, defaultView) should return 60
    expect(yToPitch(408, defaultView)).toBe(60);
  });

  it("higher Y means lower pitch", () => {
    // pitch 59 is one row below pitch 60
    // y = 24 + (84 - 59) * 16 = 24 + 400 = 424
    expect(yToPitch(424, defaultView)).toBe(59);
  });

  it("rounds to nearest integer pitch", () => {
    // y = 410 -> pitch = 84 - (410 - 24) / 16 = 84 - 24.125 = 59.875 -> rounds to 60
    expect(yToPitch(410, defaultView)).toBe(60);
  });
});

describe("pianoRollSnapToGrid", () => {
  // At 120 BPM, secPerBeat = 0.5

  it("snaps to 1/4 note", () => {
    expect(pianoRollSnapToGrid(0.3, 120, "1/4")).toBeCloseTo(0.5);
    expect(pianoRollSnapToGrid(0.7, 120, "1/4")).toBeCloseTo(0.5);
    expect(pianoRollSnapToGrid(0.8, 120, "1/4")).toBeCloseTo(1.0);
  });

  it("snaps to 1/8 note", () => {
    // gridSize = 0.25
    expect(pianoRollSnapToGrid(0.2, 120, "1/8")).toBeCloseTo(0.25);
    expect(pianoRollSnapToGrid(0.1, 120, "1/8")).toBeCloseTo(0.0);
  });

  it("snaps to 1/16 note", () => {
    // gridSize = 0.125
    expect(pianoRollSnapToGrid(0.1, 120, "1/16")).toBeCloseTo(0.125);
    expect(pianoRollSnapToGrid(0.06, 120, "1/16")).toBeCloseTo(0.0);
  });

  it("snaps to 1/8 triplet", () => {
    // gridSize = secPerBeat / 3 = 0.5 / 3 ~ 0.16667
    const grid = 0.5 / 3;
    expect(pianoRollSnapToGrid(0.15, 120, "1/8T")).toBeCloseTo(grid);
    expect(pianoRollSnapToGrid(0.4, 120, "1/8T")).toBeCloseTo(grid * 2);
  });

  it("snaps to 1/16 triplet", () => {
    // gridSize = secPerBeat / 6 = 0.5 / 6 ~ 0.08333
    const grid = 0.5 / 6;
    expect(pianoRollSnapToGrid(0.07, 120, "1/16T")).toBeCloseTo(grid);
    expect(pianoRollSnapToGrid(0.2, 120, "1/16T")).toBeCloseTo(grid * 2);
  });
});

describe("pianoRollHitTest", () => {
  it("returns ruler for clicks above PR_RULER_HEIGHT", () => {
    const result = pianoRollHitTest(
      100,
      10,
      defaultView,
      [],
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("ruler");
    if (result.kind === "ruler") {
      // xToSeconds(100, defaultView) = (100 - 48) / 100 = 0.52
      expect(result.timeSeconds).toBeCloseTo(0.52);
    }
  });

  it("returns keyboard-key for clicks in keyboard area", () => {
    const result = pianoRollHitTest(
      20,
      408,
      defaultView,
      [],
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("keyboard-key");
    if (result.kind === "keyboard-key") {
      expect(result.pitch).toBe(60);
    }
  });

  it("returns note-body for clicks on a note", () => {
    // Note at pitch 60, startTime 0, duration 0.5
    // noteX = 48 + (0 - 0) * 100 = 48
    // noteW = 0.5 * 100 = 50
    // noteY = 24 + (84 - 60) * 16 = 408
    // Click at center: x=73, y=416
    const notes = [makeNote()];
    const result = pianoRollHitTest(
      73,
      416,
      defaultView,
      notes,
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("note-body");
    if (result.kind === "note-body") {
      expect(result.noteId).toBe("n1");
    }
  });

  it("returns note-left-edge for clicks near left edge of note", () => {
    // noteX = 48, click at x=50 (2px from left edge, within 6px threshold)
    const notes = [makeNote()];
    const result = pianoRollHitTest(
      50,
      416,
      defaultView,
      notes,
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("note-left-edge");
    if (result.kind === "note-left-edge") {
      expect(result.noteId).toBe("n1");
    }
  });

  it("returns note-right-edge for clicks near right edge of note", () => {
    // noteX = 48, noteW = 50, right edge at 98
    // Click at x=95 (3px from right edge, within 6px threshold)
    const notes = [makeNote()];
    const result = pianoRollHitTest(
      95,
      416,
      defaultView,
      notes,
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("note-right-edge");
    if (result.kind === "note-right-edge") {
      expect(result.noteId).toBe("n1");
    }
  });

  it("returns velocity-bar for clicks in velocity lane on a note x range", () => {
    // velocityLaneTop = 500 - 60 = 440
    // Note x range: 48..98
    // Click at y=460 (in velocity lane), x=60 (within note x range)
    const notes = [makeNote()];
    const result = pianoRollHitTest(
      60,
      460,
      defaultView,
      notes,
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("velocity-bar");
    if (result.kind === "velocity-bar") {
      expect(result.noteId).toBe("n1");
    }
  });

  it("returns empty-grid with correct pitch and time for clicks on empty area", () => {
    const result = pianoRollHitTest(
      200,
      200,
      defaultView,
      [],
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("empty-grid");
    if (result.kind === "empty-grid") {
      // xToSeconds(200) = (200 - 48) / 100 = 1.52
      expect(result.timeSeconds).toBeCloseTo(1.52);
      // yToPitch(200) = round(84 - (200 - 24) / 16) = round(84 - 11) = 73
      expect(result.pitch).toBe(73);
    }
  });

  it("returns none for clicks in velocity lane outside any note", () => {
    // Click in velocity lane area but not within any note's x range
    const notes = [makeNote()]; // note x: 48..98
    const result = pianoRollHitTest(
      200,
      460,
      defaultView,
      notes,
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("none");
  });

  it("prioritizes later notes (reverse z-order)", () => {
    // Two overlapping notes at the same position
    const notes = [
      makeNote({ id: "n1", pitch: 60, startTime: 0, duration: 1 }),
      makeNote({ id: "n2", pitch: 60, startTime: 0, duration: 1 }),
    ];
    // Click on note body center
    const result = pianoRollHitTest(
      73,
      416,
      defaultView,
      notes,
      CANVAS_HEIGHT,
      VELOCITY_LANE_HEIGHT,
    );
    expect(result.kind).toBe("note-body");
    if (result.kind === "note-body") {
      expect(result.noteId).toBe("n2");
    }
  });
});

describe("lassoSelectNotes", () => {
  it("selects notes within rectangle", () => {
    const notes = [
      makeNote({ id: "n1", pitch: 60, startTime: 0, duration: 0.5 }),
      makeNote({ id: "n2", pitch: 72, startTime: 2, duration: 0.5 }),
    ];
    // Lasso covering only n1: noteX=48, noteW=50, noteY=408, noteH=16
    // Rectangle that covers n1 but not n2
    const ids = lassoSelectNotes(40, 400, 110, 430, defaultView, notes);
    expect(ids).toEqual(["n1"]);
  });

  it("returns empty for rectangle with no notes", () => {
    const notes = [
      makeNote({ id: "n1", pitch: 60, startTime: 0, duration: 0.5 }),
    ];
    // Rectangle far away from note
    const ids = lassoSelectNotes(500, 100, 600, 200, defaultView, notes);
    expect(ids).toEqual([]);
  });

  it("handles inverted rectangle (start > end)", () => {
    const notes = [
      makeNote({ id: "n1", pitch: 60, startTime: 0, duration: 0.5 }),
    ];
    // Inverted: start > end (dragging right-to-left, bottom-to-top)
    const ids = lassoSelectNotes(110, 430, 40, 400, defaultView, notes);
    expect(ids).toEqual(["n1"]);
  });
});
