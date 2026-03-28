import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDawStore } from "@state/store";
import type { TrackModel, ClipModel } from "@state/track/types";
import { useArrangementInteractions } from "./use-arrangement-interactions";
import type { ArrangementViewState } from "./arrangement-renderer";

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
    startTime: 1,
    sourceOffset: 0,
    duration: 2,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Clip 1",
    ...overrides,
  };
}

function mockMouseEvent(
  overrides: Partial<React.MouseEvent<HTMLCanvasElement>> = {},
): React.MouseEvent<HTMLCanvasElement> {
  return {
    clientX: 0,
    clientY: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 400,
        right: 800,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: (): void => {},
      }),
    } as HTMLCanvasElement,
    preventDefault: (): void => {},
    ...overrides,
  } as unknown as React.MouseEvent<HTMLCanvasElement>;
}

describe("useArrangementInteractions", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
      cursorSeconds: 0,
    });
  });

  it("selects clip on mouseDown on clip body", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    useDawStore.setState({ tracks, clips });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Click at center of clip: x = 160 + 1*100 + 100 = 360, y = 50
    act(() => {
      result.current.onMouseDown(mockMouseEvent({ clientX: 360, clientY: 50 }));
    });

    expect(useDawStore.getState().selectedClipIds).toContain("c1");
  });

  it("deselects clips when clicking empty lane without shift", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1" })],
      selectedClipIds: ["c1"],
    });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Click on empty lane area
    act(() => {
      result.current.onMouseDown(mockMouseEvent({ clientX: 500, clientY: 50 }));
    });

    expect(useDawStore.getState().selectedClipIds).toEqual([]);
  });

  it("sets cursor on ruler click", () => {
    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Click in ruler area: y < 24, x = 260
    // Time = (260 - 160) / 100 = 1.0
    act(() => {
      result.current.onMouseDown(mockMouseEvent({ clientX: 260, clientY: 10 }));
    });

    expect(useDawStore.getState().cursorSeconds).toBeCloseTo(1.0);
  });

  it("selects track on header click", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1" })],
    });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Click in track header area: x < 160, y in first track
    act(() => {
      result.current.onMouseDown(mockMouseEvent({ clientX: 80, clientY: 50 }));
    });

    expect(useDawStore.getState().selectedTrackIds).toContain("t1");
  });

  it("splits clip on double-click", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 4 }),
    };
    useDawStore.setState({ tracks, clips });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Double-click at x=360 (time = (360-160)/100 = 2.0)
    act(() => {
      result.current.onDoubleClick(
        mockMouseEvent({ clientX: 360, clientY: 50 }),
      );
    });

    // Original clip should be trimmed, and a new clip should exist
    const clip = useDawStore.getState().clips["c1"];
    expect(clip).toBeDefined();
    if (clip !== undefined) {
      expect(clip.duration).toBe(1); // 2.0 - 1.0
    }
    // Check that there are now 2 clips total
    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(2);
  });

  it("shift-click toggles clip selection", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1", "c2"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 0, duration: 1 }),
      c2: makeClip({ id: "c2", trackId: "t1", startTime: 2, duration: 1 }),
    };
    useDawStore.setState({ tracks, clips, selectedClipIds: ["c1"] });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Shift-click on c2 (x = 160 + 2*100 + 50 = 410, y = 50)
    act(() => {
      result.current.onMouseDown(
        mockMouseEvent({ clientX: 410, clientY: 50, shiftKey: true }),
      );
    });

    const selected = useDawStore.getState().selectedClipIds;
    expect(selected).toContain("c1");
    expect(selected).toContain("c2");
  });
});
