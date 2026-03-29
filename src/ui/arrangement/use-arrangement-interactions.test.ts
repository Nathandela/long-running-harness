import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDawStore } from "@state/store";
import type { TrackModel, AudioClipModel, ClipModel } from "@state/track/types";
import { sharedUndoManager } from "@state/undo";
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

function mockCanvasTarget(): HTMLCanvasElement {
  return {
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
    setPointerCapture: (): void => {},
    releasePointerCapture: (): void => {},
  } as unknown as HTMLCanvasElement;
}

function mockPointerEvent(
  overrides: Partial<React.PointerEvent<HTMLCanvasElement>> = {},
): React.PointerEvent<HTMLCanvasElement> {
  return {
    clientX: 0,
    clientY: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    pointerId: 1,
    currentTarget: mockCanvasTarget(),
    preventDefault: (): void => {},
    ...overrides,
  } as unknown as React.PointerEvent<HTMLCanvasElement>;
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
    currentTarget: mockCanvasTarget(),
    preventDefault: (): void => {},
    ...overrides,
  } as unknown as React.MouseEvent<HTMLCanvasElement>;
}

function mockKeyboardEvent(
  key: string,
): React.KeyboardEvent<HTMLCanvasElement> {
  return {
    key,
    preventDefault: (): void => {},
  } as unknown as React.KeyboardEvent<HTMLCanvasElement>;
}

describe("useArrangementInteractions", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
      cursorSeconds: 0,
      bpm: 120,
    });
    sharedUndoManager.clear();
  });

  it("selects clip on pointerDown on clip body", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    useDawStore.setState({ tracks, clips });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    act(() => {
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 360, clientY: 50 }),
      );
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

    act(() => {
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 500, clientY: 50 }),
      );
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
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 260, clientY: 10 }),
      );
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

    act(() => {
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 80, clientY: 50 }),
      );
    });

    expect(useDawStore.getState().selectedTrackIds).toContain("t1");
  });

  it("splits clip on double-click and pushes undo", () => {
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

    const clip = useDawStore.getState().clips["c1"];
    expect(clip).toBeDefined();
    if (clip !== undefined) {
      expect(clip.duration).toBe(1); // 2.0 - 1.0
    }
    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(2);
    expect(sharedUndoManager.canUndo).toBe(true);
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
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 410, clientY: 50, shiftKey: true }),
      );
    });

    const selected = useDawStore.getState().selectedClipIds;
    expect(selected).toContain("c1");
    expect(selected).toContain("c2");
  });

  it("pushes undo command after move-clip drag", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    useDawStore.setState({ tracks, clips });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Click center of clip
    act(() => {
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 360, clientY: 50 }),
      );
    });

    // Drag 100px right (= 1 second at 100 pps)
    act(() => {
      result.current.onPointerMove(
        mockPointerEvent({ clientX: 460, clientY: 50 }),
      );
    });

    // Release
    act(() => {
      result.current.onPointerUp(
        mockPointerEvent({ clientX: 460, clientY: 50 }),
      );
    });

    const clip = useDawStore.getState().clips["c1"];
    expect(clip?.startTime).toBeGreaterThan(1);
    expect(sharedUndoManager.canUndo).toBe(true);

    // Undo should restore original position
    sharedUndoManager.undo();
    expect(useDawStore.getState().clips["c1"]?.startTime).toBe(1);
  });

  it("split undo restores original clip", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 4 }),
    };
    useDawStore.setState({ tracks, clips });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    act(() => {
      result.current.onDoubleClick(
        mockMouseEvent({ clientX: 360, clientY: 50 }),
      );
    });

    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(2);

    sharedUndoManager.undo();

    const restored = useDawStore.getState().clips["c1"];
    expect(restored?.startTime).toBe(1);
    expect(restored?.duration).toBe(4);
    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(1);
  });

  it("does not push undo when drag results in no change", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    useDawStore.setState({ tracks, clips });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Click and immediately release (no move)
    act(() => {
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 360, clientY: 50 }),
      );
    });
    act(() => {
      result.current.onPointerUp(
        mockPointerEvent({ clientX: 360, clientY: 50 }),
      );
    });

    expect(sharedUndoManager.canUndo).toBe(false);
  });

  it("deletes selected clips on Delete key", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, ClipModel> = {
      c1: makeClip({ id: "c1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    useDawStore.setState({ tracks, clips, selectedClipIds: ["c1"] });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    act(() => {
      result.current.onKeyDown(mockKeyboardEvent("Delete"));
    });

    expect(useDawStore.getState().clips["c1"]).toBeUndefined();
    expect(useDawStore.getState().selectedClipIds).toEqual([]);

    // Undo restores the clip
    sharedUndoManager.undo();
    expect(useDawStore.getState().clips["c1"]).toBeDefined();
    expect(useDawStore.getState().clips["c1"]?.startTime).toBe(1);
  });

  it("deletes selected tracks on Delete key when no clips selected", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1" })],
      selectedTrackIds: ["t1"],
      selectedClipIds: [],
    });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    act(() => {
      result.current.onKeyDown(mockKeyboardEvent("Delete"));
    });

    expect(useDawStore.getState().tracks).toHaveLength(0);
    expect(useDawStore.getState().selectedTrackIds).toEqual([]);

    // Undo restores the track
    sharedUndoManager.undo();
    expect(useDawStore.getState().tracks).toHaveLength(1);
    expect(useDawStore.getState().tracks[0]?.id).toBe("t1");
  });

  it("removes track when clicking delete button", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1" })],
    });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Click the delete button in header (x=145, y=35 hits the delete button area)
    act(() => {
      result.current.onPointerDown(
        mockPointerEvent({ clientX: 145, clientY: 35 }),
      );
    });

    expect(useDawStore.getState().tracks).toHaveLength(0);

    // Undo restores the track
    sharedUndoManager.undo();
    expect(useDawStore.getState().tracks).toHaveLength(1);
    expect(useDawStore.getState().tracks[0]?.id).toBe("t1");
  });
});
