import { describe, it, expect, vi } from "vitest";
import type { MIDINoteEvent } from "@state/track/types";
import {
  renderPianoRoll,
  isBlackKey,
  noteName,
  secondsToX,
  pitchToY,
  type PianoRollViewState,
  type PianoRollRenderContext,
} from "./piano-roll-renderer";
import { PR_RULER_HEIGHT, PR_VELOCITY_LANE_HEIGHT } from "./constants";

// -- Helpers ------------------------------------------------------------------

type MockCtx = {
  fillRect: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  rect: ReturnType<typeof vi.fn>;
  clip: ReturnType<typeof vi.fn>;
  measureText: ReturnType<typeof vi.fn>;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textBaseline: CanvasTextBaseline;
  textAlign: CanvasTextAlign;
  globalAlpha: number;
};

function createMockCtx(): MockCtx {
  return {
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 40 }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textBaseline: "alphabetic",
    textAlign: "start",
    globalAlpha: 1,
  };
}

function makeNote(overrides: Partial<MIDINoteEvent> = {}): MIDINoteEvent {
  return {
    id: "note-1",
    pitch: 60,
    velocity: 100,
    startTime: 0,
    duration: 0.5,
    ...overrides,
  };
}

const defaultView: PianoRollViewState = {
  scrollX: 0,
  scrollY: 84,
  pixelsPerSecond: 100,
  noteHeight: 16,
  keyboardWidth: 48,
};

function makeRenderContext(
  overrides: Partial<Omit<PianoRollRenderContext, "ctx">> = {},
): { rc: PianoRollRenderContext; mock: MockCtx } {
  const mock = createMockCtx();
  const rc: PianoRollRenderContext = {
    ctx: mock as unknown as CanvasRenderingContext2D,
    width: 800,
    height: 400,
    view: defaultView,
    notes: [],
    selectedNoteIds: [],
    cursorSeconds: 0,
    bpm: 120,
    clipStartTime: 0,
    clipDuration: 8,
    tool: "select",
    velocityLaneHeight: PR_VELOCITY_LANE_HEIGHT,
    ...overrides,
  };
  return { rc, mock };
}

// -- Tests --------------------------------------------------------------------

describe("piano-roll-renderer", () => {
  describe("isBlackKey", () => {
    it("identifies black keys (C#, D#, F#, G#, A#)", () => {
      // C#=1, D#=3, F#=6, G#=8, A#=10
      expect(isBlackKey(1)).toBe(true); // C#
      expect(isBlackKey(3)).toBe(true); // D#
      expect(isBlackKey(6)).toBe(true); // F#
      expect(isBlackKey(8)).toBe(true); // G#
      expect(isBlackKey(10)).toBe(true); // A#
    });

    it("identifies white keys (C, D, E, F, G, A, B)", () => {
      expect(isBlackKey(0)).toBe(false); // C
      expect(isBlackKey(2)).toBe(false); // D
      expect(isBlackKey(4)).toBe(false); // E
      expect(isBlackKey(5)).toBe(false); // F
      expect(isBlackKey(7)).toBe(false); // G
      expect(isBlackKey(9)).toBe(false); // A
      expect(isBlackKey(11)).toBe(false); // B
    });

    it("works across octaves", () => {
      expect(isBlackKey(13)).toBe(true); // C#1
      expect(isBlackKey(60)).toBe(false); // C4
      expect(isBlackKey(61)).toBe(true); // C#4
      expect(isBlackKey(69)).toBe(false); // A4
      expect(isBlackKey(70)).toBe(true); // A#4
    });
  });

  describe("noteName", () => {
    it("returns correct name for middle C (C4)", () => {
      expect(noteName(60)).toBe("C4");
    });

    it("returns correct name for A4 (concert pitch)", () => {
      expect(noteName(69)).toBe("A4");
    });

    it("returns correct sharps", () => {
      expect(noteName(61)).toBe("C#4");
      expect(noteName(66)).toBe("F#4");
    });

    it("handles low and high notes", () => {
      expect(noteName(0)).toBe("C-1");
      expect(noteName(127)).toBe("G9");
      expect(noteName(12)).toBe("C0");
      expect(noteName(24)).toBe("C1");
    });
  });

  describe("secondsToX", () => {
    it("converts seconds to pixels accounting for keyboard width", () => {
      const view = { ...defaultView, keyboardWidth: 48, pixelsPerSecond: 100 };
      // x = keyboardWidth + (seconds - scrollX) * pps
      // x = 48 + (1 - 0) * 100 = 148
      expect(secondsToX(1, view)).toBe(148);
    });

    it("accounts for scroll offset", () => {
      const view = { ...defaultView, scrollX: 2, pixelsPerSecond: 100 };
      // x = 48 + (3 - 2) * 100 = 148
      expect(secondsToX(3, view)).toBe(148);
    });

    it("returns keyboard width for scrollX origin", () => {
      const view = { ...defaultView, scrollX: 0, pixelsPerSecond: 100 };
      expect(secondsToX(0, view)).toBe(48);
    });
  });

  describe("pitchToY", () => {
    it("places higher pitch at lower Y value (higher on screen)", () => {
      const view = { ...defaultView, scrollY: 84, noteHeight: 16 };
      const yHigh = pitchToY(84, view);
      const yLow = pitchToY(60, view);
      expect(yHigh).toBeLessThan(yLow);
    });

    it("returns ruler height when pitch equals scrollY", () => {
      const view = { ...defaultView, scrollY: 84, noteHeight: 16 };
      const y = pitchToY(84, view);
      expect(y).toBe(PR_RULER_HEIGHT);
    });

    it("each semitone step moves by noteHeight pixels", () => {
      const view = { ...defaultView, scrollY: 84, noteHeight: 16 };
      const y1 = pitchToY(84, view);
      const y2 = pitchToY(83, view);
      expect(y2 - y1).toBe(16);
    });
  });

  describe("renderPianoRoll", () => {
    it("does not crash with no notes", () => {
      const { rc } = makeRenderContext({ notes: [] });
      expect(() => {
        renderPianoRoll(rc);
      }).not.toThrow();
    });

    it("fills background", () => {
      const { rc, mock } = makeRenderContext();
      renderPianoRoll(rc);
      expect(mock.fillRect).toHaveBeenCalledWith(0, 0, 800, 400);
    });

    it("draws notes at correct positions", () => {
      const notes = [
        makeNote({ id: "n1", pitch: 80, startTime: 1, duration: 0.5 }),
      ];
      const { rc, mock } = makeRenderContext({ notes });
      renderPianoRoll(rc);

      // x = keyboardWidth + (startTime - scrollX) * pps = 48 + (1-0)*100 = 148
      // w = duration * pps = 0.5 * 100 = 50
      // y = RULER_HEIGHT + (scrollY - pitch) * noteHeight = 24 + (84-80)*16 = 88
      // h = noteHeight = 16
      const fillCalls = mock.fillRect.mock.calls as number[][];
      const noteCall = fillCalls.find(
        ([x, y, w, h]) => x === 148 && w === 50 && y === 88 && h === 16,
      );
      expect(noteCall).toBeDefined();
    });

    it("highlights selected notes with white border", () => {
      const notes = [makeNote({ id: "n1", pitch: 80, startTime: 1 })];
      const { rc, mock } = makeRenderContext({
        notes,
        selectedNoteIds: ["n1"],
      });
      renderPianoRoll(rc);

      // Selected note should get a strokeRect with white border
      expect(mock.strokeRect).toHaveBeenCalled();
      expect(mock.strokeRect.mock.calls.length).toBeGreaterThan(0);
    });

    it("draws velocity bars in the velocity lane", () => {
      const notes = [
        makeNote({
          id: "n1",
          pitch: 80,
          startTime: 1,
          duration: 0.5,
          velocity: 100,
        }),
      ];
      const { rc, mock } = makeRenderContext({ notes });
      renderPianoRoll(rc);

      // Velocity bar x should match note x (148)
      // Velocity lane is at the bottom of the canvas
      const fillCalls = mock.fillRect.mock.calls as number[][];
      const velocityLaneTop = 400 - PR_VELOCITY_LANE_HEIGHT;
      const velocityBar = fillCalls.find(
        ([x, y]) => x === 148 && y >= velocityLaneTop,
      );
      expect(velocityBar).toBeDefined();
    });

    it("draws playhead as a vertical line", () => {
      const { rc, mock } = makeRenderContext({ cursorSeconds: 2 });
      renderPianoRoll(rc);

      // Playhead x = keyboardWidth + (cursorSeconds - scrollX) * pps = 48 + 2*100 = 248
      const moveToX = (mock.moveTo.mock.calls as number[][]).filter(
        ([x]) => x === 248,
      );
      expect(moveToX.length).toBeGreaterThan(0);
    });

    it("draws piano keyboard sidebar", () => {
      const { rc, mock } = makeRenderContext();
      renderPianoRoll(rc);

      // Should draw C note labels in the keyboard
      const texts: string[] = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      const cLabels = texts.filter((t) => /^C\d+$/.test(t));
      expect(cLabels.length).toBeGreaterThan(0);
    });

    it("draws bar numbers in the ruler", () => {
      const { rc, mock } = makeRenderContext({ bpm: 120 });
      renderPianoRoll(rc);

      const texts: string[] = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      expect(texts).toContain("1");
    });
  });
});
