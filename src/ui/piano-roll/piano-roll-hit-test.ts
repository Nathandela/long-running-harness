/**
 * Hit-testing utilities for the piano roll canvas.
 * Converts pixel coordinates to note/region references.
 */
import type { MIDINoteEvent } from "@state/track/types";
import type { PianoRollViewState } from "./piano-roll-renderer";
import { secondsToX } from "./piano-roll-renderer";
import { PR_RULER_HEIGHT } from "./constants";

// -- Types --------------------------------------------------------------------

export type PianoRollGridSnap = "1/4" | "1/8" | "1/16" | "1/8T" | "1/16T";

export type PianoRollHitResult =
  | { kind: "none" }
  | { kind: "note-body"; noteId: string }
  | { kind: "note-left-edge"; noteId: string }
  | { kind: "note-right-edge"; noteId: string }
  | { kind: "velocity-bar"; noteId: string }
  | { kind: "keyboard-key"; pitch: number }
  | { kind: "ruler"; timeSeconds: number }
  | { kind: "empty-grid"; pitch: number; timeSeconds: number };

// -- Constants ----------------------------------------------------------------

const EDGE_HANDLE_PX = 6;

// -- Coordinate transforms ----------------------------------------------------

export function xToSeconds(x: number, view: PianoRollViewState): number {
  return view.scrollX + (x - view.keyboardWidth) / view.pixelsPerSecond;
}

export function yToPitch(y: number, view: PianoRollViewState): number {
  return Math.round(view.scrollY - (y - PR_RULER_HEIGHT) / view.noteHeight);
}

// -- Grid snapping ------------------------------------------------------------

export function pianoRollSnapToGrid(
  seconds: number,
  bpm: number,
  snap: PianoRollGridSnap,
): number {
  const secPerBeat = 60 / bpm;
  let gridSize: number;
  switch (snap) {
    case "1/4":
      gridSize = secPerBeat;
      break;
    case "1/8":
      gridSize = secPerBeat / 2;
      break;
    case "1/16":
      gridSize = secPerBeat / 4;
      break;
    case "1/8T":
      gridSize = secPerBeat / 3;
      break;
    case "1/16T":
      gridSize = secPerBeat / 6;
      break;
  }
  return Math.round(seconds / gridSize) * gridSize;
}

// -- Hit testing --------------------------------------------------------------

export function pianoRollHitTest(
  x: number,
  y: number,
  view: PianoRollViewState,
  notes: readonly MIDINoteEvent[],
  canvasHeight: number,
  velocityLaneHeight: number,
): PianoRollHitResult {
  // Ruler area
  if (y < PR_RULER_HEIGHT) {
    return { kind: "ruler", timeSeconds: xToSeconds(x, view) };
  }

  // Keyboard area
  if (x < view.keyboardWidth) {
    return { kind: "keyboard-key", pitch: yToPitch(y, view) };
  }

  // Velocity lane area
  const velocityLaneTop = canvasHeight - velocityLaneHeight;
  if (y >= velocityLaneTop) {
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      if (!note) continue;
      const noteX = secondsToX(note.startTime, view);
      const noteW = note.duration * view.pixelsPerSecond;
      if (x >= noteX && x <= noteX + noteW) {
        return { kind: "velocity-bar", noteId: note.id };
      }
    }
    return { kind: "none" };
  }

  // Note grid area -- check notes in reverse for z-order priority
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    if (!note) continue;
    const noteX = secondsToX(note.startTime, view);
    const noteW = note.duration * view.pixelsPerSecond;
    const noteY =
      PR_RULER_HEIGHT + (view.scrollY - note.pitch) * view.noteHeight;
    const noteH = view.noteHeight;

    if (x >= noteX && x <= noteX + noteW && y >= noteY && y <= noteY + noteH) {
      if (x - noteX < EDGE_HANDLE_PX) {
        return { kind: "note-left-edge", noteId: note.id };
      }
      if (noteX + noteW - x < EDGE_HANDLE_PX) {
        return { kind: "note-right-edge", noteId: note.id };
      }
      return { kind: "note-body", noteId: note.id };
    }
  }

  // Empty grid
  return {
    kind: "empty-grid",
    pitch: yToPitch(y, view),
    timeSeconds: xToSeconds(x, view),
  };
}

// -- Lasso selection ----------------------------------------------------------

export function lassoSelectNotes(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  view: PianoRollViewState,
  notes: readonly MIDINoteEvent[],
): readonly string[] {
  const left = Math.min(startX, endX);
  const right = Math.max(startX, endX);
  const top = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  return notes
    .filter((note) => {
      const noteX = secondsToX(note.startTime, view);
      const noteW = note.duration * view.pixelsPerSecond;
      const noteY =
        PR_RULER_HEIGHT + (view.scrollY - note.pitch) * view.noteHeight;
      const noteH = view.noteHeight;

      return (
        noteX + noteW > left &&
        noteX < right &&
        noteY + noteH > top &&
        noteY < bottom
      );
    })
    .map((n) => n.id);
}
