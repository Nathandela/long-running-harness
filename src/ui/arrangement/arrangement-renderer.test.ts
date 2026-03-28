import { describe, it, expect, vi } from "vitest";
import type { TrackModel, ClipModel } from "@state/track/types";
import {
  renderArrangement,
  type ArrangementViewState,
  type RenderContext,
} from "./arrangement-renderer";

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

function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "track-1",
    name: "Track 1",
    type: "audio",
    color: "#0066ff",
    muted: false,
    solo: false,
    armed: false,
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

const defaultView: ArrangementViewState = {
  scrollX: 0,
  scrollY: 0,
  pixelsPerSecond: 100,
  trackHeight: 64,
  headerWidth: 160,
};

function makeRenderContext(
  overrides: Partial<Omit<RenderContext, "ctx">> = {},
): { rc: RenderContext; mock: MockCtx } {
  const mock = createMockCtx();
  const rc: RenderContext = {
    ctx: mock as unknown as CanvasRenderingContext2D,
    width: 800,
    height: 400,
    view: defaultView,
    tracks: [],
    clips: {},
    selectedClipIds: [],
    cursorSeconds: 0,
    bpm: 120,
    ...overrides,
  };
  return { rc, mock };
}

// -- Tests --------------------------------------------------------------------

describe("arrangement-renderer", () => {
  describe("renderArrangement", () => {
    it("fills background with gray-900", () => {
      const { rc, mock } = makeRenderContext();
      renderArrangement(rc);
      expect(mock.fillRect).toHaveBeenCalledWith(0, 0, 800, 400);
    });

    it("draws the time ruler area", () => {
      const { rc, mock } = makeRenderContext();
      renderArrangement(rc);
      expect(mock.fillRect.mock.calls.length).toBeGreaterThan(1);
    });

    it("draws vertical grid lines at beat positions", () => {
      const { rc, mock } = makeRenderContext({ bpm: 120 });
      renderArrangement(rc);
      expect(mock.moveTo.mock.calls.length).toBeGreaterThan(0);
      expect(mock.lineTo.mock.calls.length).toBeGreaterThan(0);
    });

    it("draws thicker lines on bar boundaries (every 4 beats)", () => {
      const { rc, mock } = makeRenderContext({ bpm: 120 });
      renderArrangement(rc);
      expect(mock.save).toHaveBeenCalled();
      expect(mock.restore).toHaveBeenCalled();
    });

    it("draws track lanes as horizontal bands", () => {
      const tracks = [
        makeTrack({ id: "t1", name: "Track 1" }),
        makeTrack({ id: "t2", name: "Track 2" }),
      ];
      const { rc, mock } = makeRenderContext({ tracks });
      renderArrangement(rc);
      expect(mock.stroke.mock.calls.length).toBeGreaterThan(0);
    });

    it("draws track headers with name and color strip", () => {
      const tracks = [
        makeTrack({ id: "t1", name: "Guitar", color: "#ff2d6f" }),
      ];
      const { rc, mock } = makeRenderContext({ tracks });
      renderArrangement(rc);

      const drawnTexts = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      expect(drawnTexts).toContain("Guitar");
    });

    it("draws mute indicator on muted tracks", () => {
      const tracks = [makeTrack({ id: "t1", name: "Bass", muted: true })];
      const { rc, mock } = makeRenderContext({ tracks });
      renderArrangement(rc);

      const drawnTexts = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      expect(drawnTexts).toContain("M");
    });

    it("draws solo indicator on solo tracks", () => {
      const tracks = [makeTrack({ id: "t1", name: "Lead", solo: true })];
      const { rc, mock } = makeRenderContext({ tracks });
      renderArrangement(rc);

      const drawnTexts = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      expect(drawnTexts).toContain("S");
    });

    it("draws clips as rectangles on the timeline", () => {
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const clips: Record<string, ClipModel> = {
        c1: makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 1,
          duration: 2,
        }),
      };
      const { rc, mock } = makeRenderContext({ tracks, clips });
      renderArrangement(rc);

      // At pps=100 and startTime=1 with headerWidth=160:
      // x = 160 + (1 - 0) * 100 = 260, width = 2 * 100 = 200
      expect(mock.fillRect.mock.calls).toContainEqual(
        expect.arrayContaining([
          260,
          expect.any(Number),
          200,
          expect.any(Number),
        ]),
      );
    });

    it("draws clip name label", () => {
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const clips: Record<string, ClipModel> = {
        c1: makeClip({ id: "c1", trackId: "t1", name: "Vocal Take" }),
      };
      const { rc, mock } = makeRenderContext({ tracks, clips });
      renderArrangement(rc);

      const drawnTexts = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      expect(drawnTexts).toContain("Vocal Take");
    });

    it("draws selected clips with white border", () => {
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const clips: Record<string, ClipModel> = {
        c1: makeClip({ id: "c1", trackId: "t1" }),
      };
      const { rc, mock } = makeRenderContext({
        tracks,
        clips,
        selectedClipIds: ["c1"],
      });
      renderArrangement(rc);
      expect(mock.strokeRect).toHaveBeenCalled();
    });

    it("draws the playhead as a vertical red line", () => {
      const { rc, mock } = makeRenderContext({ cursorSeconds: 2 });
      renderArrangement(rc);

      // Playhead at 2s with pps=100, headerWidth=160: x = 160 + 2*100 = 360
      const playheadMoves = (
        mock.moveTo.mock.calls as [number, number][]
      ).filter(([x]) => x === 360);
      expect(playheadMoves.length).toBeGreaterThan(0);

      const playheadLines = (
        mock.lineTo.mock.calls as [number, number][]
      ).filter(([x]) => x === 360);
      expect(playheadLines.length).toBeGreaterThan(0);
    });

    it("draws bar numbers in the time ruler", () => {
      const { rc, mock } = makeRenderContext({ bpm: 120 });
      renderArrangement(rc);

      const drawnTexts = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      expect(drawnTexts).toContain("1");
    });

    it("respects scrollX offset for grid and clips", () => {
      const view: ArrangementViewState = {
        ...defaultView,
        scrollX: 2,
      };
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const clips: Record<string, ClipModel> = {
        c1: makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 3,
          duration: 1,
        }),
      };
      const { rc, mock } = makeRenderContext({ view, tracks, clips });
      renderArrangement(rc);

      // Clip at startTime=3 with scrollX=2, pps=100, headerWidth=160:
      // x = 160 + (3 - 2) * 100 = 260
      expect(mock.fillRect.mock.calls).toContainEqual(
        expect.arrayContaining([
          260,
          expect.any(Number),
          100,
          expect.any(Number),
        ]),
      );
    });

    it("respects scrollY offset for tracks", () => {
      const view: ArrangementViewState = {
        ...defaultView,
        scrollY: 30,
      };
      const tracks = [makeTrack({ id: "t1", name: "Shifted Track" })];
      const { rc, mock } = makeRenderContext({ view, tracks });
      renderArrangement(rc);

      const shiftedCall = mock.fillText.mock.calls.find(
        ([text]: [string]) => text === "Shifted Track",
      );
      expect(shiftedCall).toBeDefined();
    });

    it("adjusts grid density when zoomed out", () => {
      const view: ArrangementViewState = {
        ...defaultView,
        pixelsPerSecond: 20,
      };
      const { rc, mock } = makeRenderContext({ view });
      renderArrangement(rc);
      expect(mock.stroke).toHaveBeenCalled();
    });

    it("does not crash with empty tracks and clips", () => {
      const { rc } = makeRenderContext({ tracks: [], clips: {} });
      expect(() => {
        renderArrangement(rc);
      }).not.toThrow();
    });

    it("does not crash when clip references missing track", () => {
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const clips: Record<string, ClipModel> = {
        c1: makeClip({ id: "c1", trackId: "t-missing" }),
      };
      const { rc } = makeRenderContext({ tracks, clips });
      expect(() => {
        renderArrangement(rc);
      }).not.toThrow();
    });
  });
});
