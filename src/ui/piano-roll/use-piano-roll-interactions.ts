/**
 * Pointer interaction handlers for the piano roll canvas.
 * Manages draw, select, move, resize, erase, and lasso operations.
 * Pushes undo commands on completion.
 */
import { useCallback, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import type { MIDINoteEvent } from "@state/track/types";
import { isMidiClip } from "@state/track/types";
import { sharedUndoManager } from "@state/undo";
import type { UndoCommand } from "@state/undo/undo-command";
import {
  AddNoteCommand,
  RemoveNoteCommand,
  MoveNoteCommand,
  ResizeNoteCommand,
  BatchNoteCommand,
} from "@state/track/midi-commands";
import type { PianoRollViewState, PianoRollTool } from "./piano-roll-renderer";
import {
  pianoRollHitTest,
  xToSeconds,
  yToPitch,
  pianoRollSnapToGrid,
  lassoSelectNotes,
  type PianoRollGridSnap,
} from "./piano-roll-hit-test";
import { PR_VELOCITY_LANE_HEIGHT } from "./constants";

type DragState =
  | { kind: "idle" }
  | {
      kind: "move-note";
      noteId: string;
      clipId: string;
      startX: number;
      startY: number;
      origStartTime: number;
      origPitch: number;
    }
  | {
      kind: "resize-note";
      noteId: string;
      clipId: string;
      startX: number;
      origStartTime: number;
      origDuration: number;
      edge: "left" | "right";
    }
  | {
      kind: "draw-note";
      clipId: string;
      noteId: string;
      startTime: number;
      pitch: number;
    }
  | { kind: "rubber-band"; startX: number; startY: number };

export type PianoRollInteractions = {
  cursor: string;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  deleteSelectedNotes: () => void;
};

let noteCounter = 0;
function generateNoteId(): string {
  noteCounter += 1;
  return `note-${String(Date.now())}-${String(noteCounter)}`;
}

function gridDuration(bpm: number, snap: PianoRollGridSnap): number {
  const secPerBeat = 60 / bpm;
  switch (snap) {
    case "1/4":
      return secPerBeat;
    case "1/8":
      return secPerBeat / 2;
    case "1/16":
      return secPerBeat / 4;
    case "1/8T":
      return secPerBeat / 3;
    case "1/16T":
      return secPerBeat / 6;
  }
}

export function usePianoRollInteractions(
  clipId: string | null,
  view: PianoRollViewState,
  tool: PianoRollTool,
  gridSnap: PianoRollGridSnap,
): PianoRollInteractions {
  const dragRef = useRef<DragState>({ kind: "idle" });
  const [cursor, setCursor] = useState(
    clipId !== null && tool === "pencil" ? "crosshair" : "default",
  );

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [],
  );

  const getNotes = useCallback((): readonly MIDINoteEvent[] => {
    if (clipId === null) return [];
    const clip = useDawStore.getState().clips[clipId];
    if (clip === undefined || !isMidiClip(clip)) return [];
    return clip.noteEvents;
  }, [clipId]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      if (clipId === null) return;

      const { x, y } = getCanvasPos(e);
      const state = useDawStore.getState();
      const notes = getNotes();
      const canvasHeight = e.currentTarget.getBoundingClientRect().height;
      const hit = pianoRollHitTest(
        x,
        y,
        view,
        notes,
        canvasHeight,
        PR_VELOCITY_LANE_HEIGHT,
      );

      switch (tool) {
        case "pencil": {
          if (hit.kind === "empty-grid") {
            const snappedTime = pianoRollSnapToGrid(
              hit.timeSeconds,
              state.bpm,
              gridSnap,
            );
            const dur = gridDuration(state.bpm, gridSnap);
            const noteId = generateNoteId();
            const note: MIDINoteEvent = {
              id: noteId,
              pitch: hit.pitch,
              velocity: 100,
              startTime: Math.max(0, snappedTime),
              duration: dur,
            };
            const cmd = new AddNoteCommand(clipId, note);
            cmd.execute();
            sharedUndoManager.push(cmd);

            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = {
              kind: "draw-note",
              clipId,
              noteId,
              startTime: note.startTime,
              pitch: note.pitch,
            };
          }
          break;
        }
        case "select": {
          if (hit.kind === "note-body") {
            if (e.shiftKey) {
              const current = [...state.selectedNoteIds];
              const idx = current.indexOf(hit.noteId);
              if (idx >= 0) {
                current.splice(idx, 1);
              } else {
                current.push(hit.noteId);
              }
              state.setSelectedNoteIds(current);
            } else {
              if (!state.selectedNoteIds.includes(hit.noteId)) {
                state.setSelectedNoteIds([hit.noteId]);
              }
            }

            // Find note for drag
            const note = notes.find((n) => n.id === hit.noteId);
            if (note !== undefined) {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = {
                kind: "move-note",
                noteId: hit.noteId,
                clipId,
                startX: x,
                startY: y,
                origStartTime: note.startTime,
                origPitch: note.pitch,
              };
            }
          } else if (
            hit.kind === "note-left-edge" ||
            hit.kind === "note-right-edge"
          ) {
            state.setSelectedNoteIds([hit.noteId]);
            const note = notes.find((n) => n.id === hit.noteId);
            if (note !== undefined) {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = {
                kind: "resize-note",
                noteId: hit.noteId,
                clipId,
                startX: x,
                origStartTime: note.startTime,
                origDuration: note.duration,
                edge: hit.kind === "note-left-edge" ? "left" : "right",
              };
            }
          } else if (hit.kind === "empty-grid") {
            if (!e.shiftKey) {
              state.setSelectedNoteIds([]);
            }
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { kind: "rubber-band", startX: x, startY: y };
          }
          break;
        }
        case "erase": {
          if (
            hit.kind === "note-body" ||
            hit.kind === "note-left-edge" ||
            hit.kind === "note-right-edge"
          ) {
            const cmd = new RemoveNoteCommand(clipId, hit.noteId);
            cmd.execute();
            sharedUndoManager.push(cmd);
          }
          break;
        }
      }
    },
    [clipId, view, tool, gridSnap, getCanvasPos, getNotes],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const { x, y } = getCanvasPos(e);
      const drag = dragRef.current;
      const state = useDawStore.getState();

      if (drag.kind === "idle") {
        // Update cursor based on hover
        if (clipId === null) {
          setCursor("default");
          return;
        }

        const notes = getNotes();
        const canvasHeight = e.currentTarget.getBoundingClientRect().height;
        const hit = pianoRollHitTest(
          x,
          y,
          view,
          notes,
          canvasHeight,
          PR_VELOCITY_LANE_HEIGHT,
        );

        if (tool === "pencil") {
          setCursor("crosshair");
        } else if (tool === "select") {
          switch (hit.kind) {
            case "note-body":
              setCursor("pointer");
              break;
            case "note-left-edge":
            case "note-right-edge":
              setCursor("ew-resize");
              break;
            default:
              setCursor("default");
              break;
          }
        } else {
          setCursor("default");
        }
        return;
      }

      switch (drag.kind) {
        case "move-note": {
          setCursor("grabbing");
          const deltaPx = x - drag.startX;
          const deltaSec = deltaPx / view.pixelsPerSecond;
          const newTime = pianoRollSnapToGrid(
            Math.max(0, drag.origStartTime + deltaSec),
            state.bpm,
            gridSnap,
          );
          const newPitch = yToPitch(y, view);
          state.moveNoteEvent(drag.clipId, drag.noteId, newTime, newPitch);
          break;
        }
        case "resize-note": {
          setCursor("ew-resize");
          const deltaPx = x - drag.startX;
          const deltaSec = deltaPx / view.pixelsPerSecond;
          if (drag.edge === "left") {
            const origEnd = drag.origStartTime + drag.origDuration;
            const newStartTime = Math.max(
              0,
              Math.min(drag.origStartTime + deltaSec, origEnd - 0.01),
            );
            const newDuration = origEnd - newStartTime;
            state.moveNoteEvent(
              drag.clipId,
              drag.noteId,
              newStartTime,
              // Keep pitch unchanged -- look up current pitch
              getNotes().find((n) => n.id === drag.noteId)?.pitch ?? 0,
            );
            state.resizeNoteEvent(drag.clipId, drag.noteId, newDuration);
          } else {
            const newDuration = Math.max(0.01, drag.origDuration + deltaSec);
            state.resizeNoteEvent(drag.clipId, drag.noteId, newDuration);
          }
          break;
        }
        case "draw-note": {
          // Extend note duration as user drags
          const currentTime = xToSeconds(x, view);
          const snappedEnd = pianoRollSnapToGrid(
            currentTime,
            state.bpm,
            gridSnap,
          );
          const newDuration = Math.max(
            gridDuration(state.bpm, gridSnap),
            snappedEnd - drag.startTime,
          );
          state.resizeNoteEvent(drag.clipId, drag.noteId, newDuration);
          break;
        }
        case "rubber-band": {
          if (clipId === null) break;
          const notes = getNotes();
          const selected = lassoSelectNotes(
            drag.startX,
            drag.startY,
            x,
            y,
            view,
            notes,
          );
          state.setSelectedNoteIds([...selected]);
          break;
        }
      }
    },
    [clipId, view, tool, gridSnap, getCanvasPos, getNotes],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const drag = dragRef.current;

      if (drag.kind === "move-note") {
        const notes = getNotes();
        const note = notes.find((n) => n.id === drag.noteId);
        if (
          note !== undefined &&
          (note.startTime !== drag.origStartTime ||
            note.pitch !== drag.origPitch)
        ) {
          const cmd = new MoveNoteCommand(
            drag.clipId,
            drag.noteId,
            note.startTime,
            note.pitch,
            drag.origStartTime,
            drag.origPitch,
          );
          // Store is already updated during drag -- just record for undo
          sharedUndoManager.push(cmd);
        }
      } else if (drag.kind === "resize-note") {
        const notes = getNotes();
        const note = notes.find((n) => n.id === drag.noteId);
        if (note !== undefined) {
          if (drag.edge === "left") {
            // Left-edge drag changed both startTime and duration
            const cmds: UndoCommand[] = [];
            if (note.startTime !== drag.origStartTime) {
              cmds.push(
                new MoveNoteCommand(
                  drag.clipId,
                  drag.noteId,
                  note.startTime,
                  note.pitch,
                  drag.origStartTime,
                  note.pitch,
                ),
              );
            }
            if (note.duration !== drag.origDuration) {
              cmds.push(
                new ResizeNoteCommand(
                  drag.clipId,
                  drag.noteId,
                  note.duration,
                  drag.origDuration,
                ),
              );
            }
            if (cmds.length > 0) {
              const batch = new BatchNoteCommand(cmds);
              sharedUndoManager.push(batch);
            }
          } else if (note.duration !== drag.origDuration) {
            const cmd = new ResizeNoteCommand(
              drag.clipId,
              drag.noteId,
              note.duration,
              drag.origDuration,
            );
            sharedUndoManager.push(cmd);
          }
        }
      } else if (drag.kind === "draw-note") {
        // If the user dragged to extend the note, capture a resize command
        // so redo restores the final dragged duration (not the initial grid-step size)
        const notes = getNotes();
        const note = notes.find((n) => n.id === drag.noteId);
        if (note !== undefined) {
          const state = useDawStore.getState();
          const initialDuration = gridDuration(state.bpm, gridSnap);
          if (note.duration !== initialDuration) {
            const cmd = new ResizeNoteCommand(
              drag.clipId,
              drag.noteId,
              note.duration,
              initialDuration,
            );
            sharedUndoManager.push(cmd);
          }
        }
      }

      if (drag.kind !== "idle") {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      dragRef.current = { kind: "idle" };

      // Restore tool-appropriate cursor
      if (tool === "pencil") {
        setCursor("crosshair");
      } else {
        setCursor("default");
      }
    },
    [tool, gridSnap, getNotes],
  );

  const deleteSelectedNotes = useCallback((): void => {
    if (clipId === null) return;
    const state = useDawStore.getState();
    const selected = state.selectedNoteIds;
    if (selected.length === 0) return;

    const commands = selected.map(
      (noteId) => new RemoveNoteCommand(clipId, noteId),
    );
    const batch = new BatchNoteCommand(commands);
    batch.execute();
    sharedUndoManager.push(batch);
    state.setSelectedNoteIds([]);
  }, [clipId]);

  return {
    cursor,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    deleteSelectedNotes,
  };
}
