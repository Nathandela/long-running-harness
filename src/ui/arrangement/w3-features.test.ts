/**
 * Tests for W3 epic features:
 * - Double-click MIDI clip opens piano roll (not split)
 * - Double-click empty lane on instrument track creates MIDI clip
 * - Audio clips still split on double-click
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDawStore } from "@state/store";
import type {
  TrackModel,
  AudioClipModel,
  MidiClipModel,
} from "@state/track/types";
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

function makeAudioClip(
  overrides: Partial<AudioClipModel> = {},
): AudioClipModel {
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
    name: "Audio Clip",
    ...overrides,
  };
}

function makeMidiClip(overrides: Partial<MidiClipModel> = {}): MidiClipModel {
  return {
    type: "midi",
    id: "m1",
    trackId: "t1",
    startTime: 1,
    duration: 2,
    noteEvents: [],
    name: "MIDI Clip",
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

describe("W3: double-click MIDI clip opens piano roll", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
      selectedNoteIds: [],
      cursorSeconds: 0,
      bpm: 120,
    });
    sharedUndoManager.clear();
  });

  it("calls onOpenPianoRoll when double-clicking a MIDI clip", () => {
    const tracks = [
      makeTrack({ id: "t1", type: "instrument", clipIds: ["m1"] }),
    ];
    const clips: Record<string, MidiClipModel> = {
      m1: makeMidiClip({ id: "m1", trackId: "t1", startTime: 1, duration: 2 }),
    };
    useDawStore.setState({ tracks, clips });

    const onOpenPianoRoll = vi.fn();
    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4", onOpenPianoRoll),
    );

    // Double-click on MIDI clip body: clip starts at x=260 (160+1*100),
    // move past trim handle (8px) to x=300
    act(() => {
      result.current.onDoubleClick(
        mockMouseEvent({ clientX: 300, clientY: 50 }),
      );
    });

    expect(onOpenPianoRoll).toHaveBeenCalledWith("m1");
    // Should NOT split the clip
    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(1);
  });

  it("still splits audio clips on double-click", () => {
    const tracks = [makeTrack({ id: "t1", clipIds: ["c1"] })];
    const clips: Record<string, AudioClipModel> = {
      c1: makeAudioClip({ id: "c1", trackId: "t1", startTime: 1, duration: 4 }),
    };
    useDawStore.setState({ tracks, clips });

    const onOpenPianoRoll = vi.fn();
    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4", onOpenPianoRoll),
    );

    // Double-click at x=360 (time 2.0) on audio clip
    act(() => {
      result.current.onDoubleClick(
        mockMouseEvent({ clientX: 360, clientY: 50 }),
      );
    });

    expect(onOpenPianoRoll).not.toHaveBeenCalled();
    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(2);
  });
});

describe("W3: double-click empty lane creates MIDI clip on instrument track", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
      selectedNoteIds: [],
      cursorSeconds: 0,
      bpm: 120,
    });
    sharedUndoManager.clear();
  });

  it("creates a MIDI clip on double-click empty lane of instrument track", () => {
    const tracks = [makeTrack({ id: "t1", type: "instrument" })];
    useDawStore.setState({ tracks });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    // Double-click at x=360 (time 2.0), y=50 (track 0 lane)
    act(() => {
      result.current.onDoubleClick(
        mockMouseEvent({ clientX: 360, clientY: 50 }),
      );
    });

    const state = useDawStore.getState();
    const clipIds = Object.keys(state.clips);
    expect(clipIds).toHaveLength(1);
    const clipId = clipIds[0];
    expect(clipId).toBeDefined();
    if (clipId === undefined) return;
    const clip = state.clips[clipId];
    expect(clip).toBeDefined();
    expect(clip?.type).toBe("midi");
    expect(clip?.trackId).toBe("t1");
    expect(sharedUndoManager.canUndo).toBe(true);
  });

  it("does NOT create MIDI clip on double-click empty lane of audio track", () => {
    const tracks = [makeTrack({ id: "t1", type: "audio" })];
    useDawStore.setState({ tracks });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    act(() => {
      result.current.onDoubleClick(
        mockMouseEvent({ clientX: 360, clientY: 50 }),
      );
    });

    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(0);
  });

  it("undo removes the created MIDI clip", () => {
    const tracks = [makeTrack({ id: "t1", type: "instrument" })];
    useDawStore.setState({ tracks });

    const { result } = renderHook(() =>
      useArrangementInteractions(defaultView, "1/4"),
    );

    act(() => {
      result.current.onDoubleClick(
        mockMouseEvent({ clientX: 360, clientY: 50 }),
      );
    });

    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(1);

    sharedUndoManager.undo();

    expect(Object.keys(useDawStore.getState().clips)).toHaveLength(0);
  });
});
