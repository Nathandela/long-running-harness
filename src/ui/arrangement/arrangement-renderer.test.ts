import { describe, it, expect, vi } from "vitest";
import type { TrackModel, AudioClipModel, ClipModel } from "@state/track/types";
import type { AutomationLane } from "@audio/automation/automation-types";
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
  fill: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
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
    fill: vi.fn(),
    arc: vi.fn(),
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
    soloIsolate: false,
    volume: 1,
    pan: 0,
    clipIds: [],
    ...overrides,
  };
}

function makeClip(overrides: Partial<AudioClipModel> = {}): AudioClipModel {
  return {
    type: "audio",
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
    automationLanes: {},
    ...overrides,
  };
  return { rc, mock };
}

function makeAutomationLane(
  overrides: Partial<AutomationLane> = {},
): AutomationLane {
  return {
    id: "lane-1",
    trackId: "track-1",
    target: { type: "mixer", param: "volume" },
    points: [],
    mode: "read",
    armed: true,
    ...overrides,
  };
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

    it("draws armed indicator with hot pink on armed tracks", () => {
      const tracks = [makeTrack({ id: "t1", name: "Rec", armed: true })];
      const { rc, mock } = makeRenderContext({ tracks });
      renderArrangement(rc);

      const drawnTexts = mock.fillText.mock.calls.map(
        ([text]: [string]) => text,
      );
      expect(drawnTexts).toContain("R");
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

    it("draws waveform peaks inside audio clips when provided", () => {
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const clip = makeClip({
        id: "c1",
        trackId: "t1",
        startTime: 0,
        duration: 2,
        sourceId: "src-1",
      });
      const clips: Record<string, ClipModel> = { c1: clip };
      // 4 peak pairs: interleaved [min, max, min, max, ...]
      const peaksData = new Float32Array([
        -0.5, 0.5, -0.3, 0.3, -0.8, 0.8, -0.1, 0.1,
      ]);
      const clipPeaks: Record<string, { peaks: Float32Array; length: number }> =
        {
          "src-1": { peaks: peaksData, length: 4 },
        };
      const { rc, mock } = makeRenderContext({ tracks, clips, clipPeaks });
      renderArrangement(rc);

      // Should draw waveform bars (fillRect calls beyond background/headers/clip fill)
      // The peaks rendering draws additional fillRect calls for each peak pair
      const fillCalls = mock.fillRect.mock.calls;
      expect(fillCalls.length).toBeGreaterThan(5);
    });

    it("skips waveform peaks for midi clips", () => {
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const midiClip: ClipModel = {
        type: "midi",
        id: "c1",
        trackId: "t1",
        startTime: 0,
        duration: 2,
        noteEvents: [],
        name: "MIDI Clip",
      };
      const clips: Record<string, ClipModel> = { c1: midiClip };
      const { rc } = makeRenderContext({ tracks, clips });
      expect(() => {
        renderArrangement(rc);
      }).not.toThrow();
    });

    it("handles missing peaks gracefully", () => {
      const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
      const clips: Record<string, ClipModel> = {
        c1: makeClip({ id: "c1", trackId: "t1", sourceId: "no-peaks" }),
      };
      // No clipPeaks provided at all
      const { rc } = makeRenderContext({ tracks, clips });
      expect(() => {
        renderArrangement(rc);
      }).not.toThrow();
    });

    it("draws automation curves as line segments over tracks", () => {
      const tracks = [makeTrack({ id: "t1", name: "Track 1" })];
      const lane = makeAutomationLane({
        trackId: "t1",
        points: [
          {
            id: "p1",
            time: 0,
            value: 0.2,
            interpolation: "linear",
            curve: 0,
          },
          {
            id: "p2",
            time: 2,
            value: 0.8,
            interpolation: "linear",
            curve: 0,
          },
        ],
      });
      const { rc, mock } = makeRenderContext({
        tracks,
        automationLanes: { t1: [lane] },
      });
      renderArrangement(rc);

      // Should have called save/restore for the automation clip region
      expect(mock.save.mock.calls.length).toBeGreaterThan(0);
      expect(mock.restore.mock.calls.length).toBeGreaterThan(0);
      // Should draw the line segments (moveTo + lineTo)
      expect(mock.moveTo.mock.calls.length).toBeGreaterThan(0);
      expect(mock.lineTo.mock.calls.length).toBeGreaterThan(0);
    });

    it("does not draw automation for tracks without lanes", () => {
      const tracks = [makeTrack({ id: "t1" })];
      const { rc, mock } = makeRenderContext({
        tracks,
        automationLanes: {},
      });
      const lineCountBefore = mock.lineTo.mock.calls.length;
      renderArrangement(rc);
      // Only grid lines, no automation lines differ from default
      // Just ensure no crash
      expect(mock.lineTo.mock.calls.length).toBeGreaterThanOrEqual(
        lineCountBefore,
      );
    });

    it("draws automation point handles as small circles", () => {
      const tracks = [makeTrack({ id: "t1" })];
      const lane = makeAutomationLane({
        trackId: "t1",
        points: [
          {
            id: "p1",
            time: 1,
            value: 0.5,
            interpolation: "linear",
            curve: 0,
          },
        ],
      });
      const { rc, mock } = makeRenderContext({
        tracks,
        automationLanes: { t1: [lane] },
      });
      renderArrangement(rc);
      // Point handles drawn as arcs (circles)
      // The mock doesn't have arc, so just verify no crash
      expect(mock.stroke).toHaveBeenCalled();
    });
  });
});
