import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDawStore } from "@state/store";
import type { MidiClipModel, MIDINoteEvent } from "@state/track/types";
import { sharedUndoManager } from "@state/undo";
import { usePianoRollInteractions } from "./use-piano-roll-interactions";
import type { PianoRollViewState } from "./piano-roll-renderer";
import type { PianoRollGridSnap } from "./piano-roll-hit-test";
import {
  PR_DEFAULT_NOTE_HEIGHT,
  PR_KEYBOARD_WIDTH,
  PR_DEFAULT_PPS,
  PR_DEFAULT_SCROLL_Y,
} from "./constants";

const defaultView: PianoRollViewState = {
  scrollX: 0,
  scrollY: PR_DEFAULT_SCROLL_Y,
  pixelsPerSecond: PR_DEFAULT_PPS,
  noteHeight: PR_DEFAULT_NOTE_HEIGHT,
  keyboardWidth: PR_KEYBOARD_WIDTH,
};

const defaultSnap: PianoRollGridSnap = "1/8";

function makeNote(overrides: Partial<MIDINoteEvent> = {}): MIDINoteEvent {
  return {
    id: "n1",
    pitch: 76,
    velocity: 100,
    startTime: 0.5,
    duration: 0.25,
    ...overrides,
  };
}

function makeMidiClip(overrides: Partial<MidiClipModel> = {}): MidiClipModel {
  return {
    type: "midi",
    id: "clip1",
    trackId: "t1",
    startTime: 0,
    duration: 4,
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

/**
 * Compute canvas x for a given time in seconds.
 * x = keyboardWidth + (time - scrollX) * pixelsPerSecond
 */
function timeToX(time: number, view: PianoRollViewState = defaultView): number {
  return view.keyboardWidth + (time - view.scrollX) * view.pixelsPerSecond;
}

/**
 * Compute canvas y for a given MIDI pitch.
 * y = RULER_HEIGHT + (scrollY - pitch) * noteHeight
 * RULER_HEIGHT = 24
 */
function pitchToCanvasY(
  pitch: number,
  view: PianoRollViewState = defaultView,
): number {
  return 24 + (view.scrollY - pitch) * view.noteHeight;
}

describe("usePianoRollInteractions", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedNoteIds: [],
      cursorSeconds: 0,
      bpm: 120,
    });
    sharedUndoManager.clear();
  });

  describe("pencil tool", () => {
    it("creates a note on empty grid click", () => {
      const clip = makeMidiClip({ id: "clip1" });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "pencil", defaultSnap),
      );

      // Click at empty grid area: pitch 60, some time
      const x = timeToX(0.5);
      const y = pitchToCanvasY(76);

      act(() => {
        result.current.onPointerDown(
          mockPointerEvent({ clientX: x, clientY: y }),
        );
      });
      act(() => {
        result.current.onPointerUp(
          mockPointerEvent({ clientX: x, clientY: y }),
        );
      });

      const updatedClip = useDawStore.getState().clips["clip1"];
      expect(updatedClip).toBeDefined();
      if (updatedClip && updatedClip.type === "midi") {
        expect(updatedClip.noteEvents.length).toBe(1);
        expect(updatedClip.noteEvents[0]?.velocity).toBe(100);
      }
      expect(sharedUndoManager.canUndo).toBe(true);
    });

    it("sets crosshair cursor for pencil tool on empty grid", () => {
      const clip = makeMidiClip({ id: "clip1" });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "pencil", defaultSnap),
      );

      expect(result.current.cursor).toBe("crosshair");
    });
  });

  describe("erase tool", () => {
    it("deletes a note on click", () => {
      const note = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.25,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [note] });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "erase", defaultSnap),
      );

      // Click on the note
      const x = timeToX(0.6);
      const y = pitchToCanvasY(76) + defaultView.noteHeight / 2;

      act(() => {
        result.current.onPointerDown(
          mockPointerEvent({ clientX: x, clientY: y }),
        );
      });

      const updatedClip = useDawStore.getState().clips["clip1"];
      if (updatedClip && updatedClip.type === "midi") {
        expect(updatedClip.noteEvents.length).toBe(0);
      }
      expect(sharedUndoManager.canUndo).toBe(true);
    });
  });

  describe("select tool", () => {
    it("selects a note on click", () => {
      const note = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.25,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [note] });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      const x = timeToX(0.6);
      const y = pitchToCanvasY(76) + defaultView.noteHeight / 2;

      act(() => {
        result.current.onPointerDown(
          mockPointerEvent({ clientX: x, clientY: y }),
        );
      });

      expect(useDawStore.getState().selectedNoteIds).toContain("n1");
    });

    it("shift-click toggles note selection", () => {
      const n1 = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.25,
      });
      const n2 = makeNote({
        id: "n2",
        pitch: 74,
        startTime: 1.0,
        duration: 0.25,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [n1, n2] });
      useDawStore.setState({
        clips: { clip1: clip },
        selectedNoteIds: ["n1"],
      });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      // Shift-click on n2
      const x = timeToX(1.1);
      const y = pitchToCanvasY(74) + defaultView.noteHeight / 2;

      act(() => {
        result.current.onPointerDown(
          mockPointerEvent({ clientX: x, clientY: y, shiftKey: true }),
        );
      });

      const selected = useDawStore.getState().selectedNoteIds;
      expect(selected).toContain("n1");
      expect(selected).toContain("n2");
    });

    it("deselects on shift-click of already selected note", () => {
      const n1 = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.25,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [n1] });
      useDawStore.setState({
        clips: { clip1: clip },
        selectedNoteIds: ["n1"],
      });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      const x = timeToX(0.6);
      const y = pitchToCanvasY(76) + defaultView.noteHeight / 2;

      act(() => {
        result.current.onPointerDown(
          mockPointerEvent({ clientX: x, clientY: y, shiftKey: true }),
        );
      });

      expect(useDawStore.getState().selectedNoteIds).not.toContain("n1");
    });

    it("sets pointer cursor when hovering note body", () => {
      const note = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.25,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [note] });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      const x = timeToX(0.6);
      const y = pitchToCanvasY(76) + defaultView.noteHeight / 2;

      act(() => {
        result.current.onPointerMove(
          mockPointerEvent({ clientX: x, clientY: y }),
        );
      });

      expect(result.current.cursor).toBe("pointer");
    });

    it("sets ew-resize cursor on note edge", () => {
      const note = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.5,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [note] });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      // Hover at the right edge of the note
      const noteEndX = timeToX(0.5 + 0.5);
      const x = noteEndX - 3; // within edge handle
      const y = pitchToCanvasY(76) + defaultView.noteHeight / 2;

      act(() => {
        result.current.onPointerMove(
          mockPointerEvent({ clientX: x, clientY: y }),
        );
      });

      expect(result.current.cursor).toBe("ew-resize");
    });
  });

  describe("delete selected notes", () => {
    it("removes all selected notes and pushes undo", () => {
      const n1 = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.25,
      });
      const n2 = makeNote({
        id: "n2",
        pitch: 74,
        startTime: 1.0,
        duration: 0.25,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [n1, n2] });
      useDawStore.setState({
        clips: { clip1: clip },
        selectedNoteIds: ["n1", "n2"],
      });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      act(() => {
        result.current.deleteSelectedNotes();
      });

      const updatedClip = useDawStore.getState().clips["clip1"];
      if (updatedClip && updatedClip.type === "midi") {
        expect(updatedClip.noteEvents.length).toBe(0);
      }
      expect(useDawStore.getState().selectedNoteIds).toEqual([]);
      expect(sharedUndoManager.canUndo).toBe(true);
    });
  });

  describe("move note drag", () => {
    it("moves note on drag and pushes undo", () => {
      const note = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.25,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [note] });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      const startX = timeToX(0.6);
      const startY = pitchToCanvasY(76) + defaultView.noteHeight / 2;

      // Pointer down on note body
      act(() => {
        result.current.onPointerDown(
          mockPointerEvent({ clientX: startX, clientY: startY }),
        );
      });

      // Drag right by 100px (= 1 second at 100pps)
      act(() => {
        result.current.onPointerMove(
          mockPointerEvent({ clientX: startX + 100, clientY: startY }),
        );
      });

      // Release
      act(() => {
        result.current.onPointerUp(
          mockPointerEvent({ clientX: startX + 100, clientY: startY }),
        );
      });

      const updatedClip = useDawStore.getState().clips["clip1"];
      if (updatedClip && updatedClip.type === "midi") {
        const movedNote = updatedClip.noteEvents.find((n) => n.id === "n1");
        expect(movedNote).toBeDefined();
        if (movedNote) {
          expect(movedNote.startTime).toBeGreaterThan(0.5);
        }
      }
      expect(sharedUndoManager.canUndo).toBe(true);
    });
  });

  describe("resize note drag", () => {
    it("resizes note on right-edge drag and pushes undo", () => {
      const note = makeNote({
        id: "n1",
        pitch: 76,
        startTime: 0.5,
        duration: 0.5,
      });
      const clip = makeMidiClip({ id: "clip1", noteEvents: [note] });
      useDawStore.setState({ clips: { clip1: clip } });

      const { result } = renderHook(() =>
        usePianoRollInteractions("clip1", defaultView, "select", defaultSnap),
      );

      // Click on right edge
      const noteEndX = timeToX(1.0);
      const startX = noteEndX - 3;
      const y = pitchToCanvasY(76) + defaultView.noteHeight / 2;

      act(() => {
        result.current.onPointerDown(
          mockPointerEvent({ clientX: startX, clientY: y }),
        );
      });

      // Drag right by 50px (= 0.5 seconds)
      act(() => {
        result.current.onPointerMove(
          mockPointerEvent({ clientX: startX + 50, clientY: y }),
        );
      });

      act(() => {
        result.current.onPointerUp(
          mockPointerEvent({ clientX: startX + 50, clientY: y }),
        );
      });

      const updatedClip = useDawStore.getState().clips["clip1"];
      if (updatedClip && updatedClip.type === "midi") {
        const resized = updatedClip.noteEvents.find((n) => n.id === "n1");
        expect(resized).toBeDefined();
        if (resized) {
          expect(resized.duration).toBeGreaterThan(0.5);
        }
      }
      expect(sharedUndoManager.canUndo).toBe(true);
    });
  });

  describe("no clip", () => {
    it("returns default cursor when clipId is null", () => {
      const { result } = renderHook(() =>
        usePianoRollInteractions(null, defaultView, "pencil", defaultSnap),
      );

      expect(result.current.cursor).toBe("default");
    });
  });
});
