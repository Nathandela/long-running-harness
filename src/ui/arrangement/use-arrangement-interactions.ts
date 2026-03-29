/**
 * Pointer interaction handlers for the arrangement canvas.
 * Manages drag operations for clip move, trim, split, and selection.
 * Pushes undo commands on drag completion.
 */
import { useCallback, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import type { ClipModel, MidiClipModel } from "@state/track/types";
import { isAudioClip, isMidiClip } from "@state/track/types";
import type { UndoCommand } from "@state/undo";
import { BatchCommand, sharedUndoManager } from "@state/undo";
import {
  AddClipCommand,
  RemoveClipCommand,
  RemoveTrackCommand,
  SplitClipCommand,
} from "@state/track/track-commands";
import type { ArrangementViewState } from "./arrangement-renderer";
import { hitTest, xToSeconds, snapToGrid, type GridSnap } from "./hit-test";
import { RULER_HEIGHT } from "./constants";

type DragState =
  | { kind: "idle" }
  | {
      kind: "move-clip";
      clipId: string;
      originTrackId: string;
      startX: number;
      startTime: number;
      beforeClip: ClipModel;
    }
  | {
      kind: "trim-left";
      clipId: string;
      startX: number;
      originalStart: number;
      originalSourceOffset: number;
      originalDuration: number;
      beforeClip: ClipModel;
    }
  | {
      kind: "trim-right";
      clipId: string;
      startX: number;
      originalEnd: number;
      originalStart: number;
      beforeClip: ClipModel;
    }
  | {
      kind: "rubber-band";
      startX: number;
      startY: number;
    }
  | {
      kind: "loop-drag";
      startSeconds: number;
    };

export type ArrangementInteractions = {
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  cursor: string;
};

export function useArrangementInteractions(
  view: ArrangementViewState,
  gridSnap: GridSnap,
  onOpenPianoRoll?: (clipId: string) => void,
): ArrangementInteractions {
  const dragRef = useRef<DragState>({ kind: "idle" });
  const [cursor, setCursor] = useState("default");

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const { x, y } = getCanvasPos(e);
      const state = useDawStore.getState();
      const hit = hitTest(x, y, view, state.tracks, state.clips);

      switch (hit.kind) {
        case "clip-body": {
          const clip = state.clips[hit.clipId];
          if (clip === undefined) break;

          if (e.shiftKey) {
            const current = [...state.selectedClipIds];
            const idx = current.indexOf(hit.clipId);
            if (idx >= 0) {
              current.splice(idx, 1);
            } else {
              current.push(hit.clipId);
            }
            state.setSelectedClipIds(current);
          } else if (!state.selectedClipIds.includes(hit.clipId)) {
            state.setSelectedClipIds([hit.clipId]);
          }

          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = {
            kind: "move-clip",
            clipId: hit.clipId,
            originTrackId: clip.trackId,
            startX: x,
            startTime: clip.startTime,
            beforeClip: { ...clip },
          };
          break;
        }
        case "clip-left-edge": {
          const clip = state.clips[hit.clipId];
          if (clip === undefined) break;
          state.setSelectedClipIds([hit.clipId]);
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = {
            kind: "trim-left",
            clipId: hit.clipId,
            startX: x,
            originalStart: clip.startTime,
            originalSourceOffset: isAudioClip(clip) ? clip.sourceOffset : 0,
            originalDuration: clip.duration,
            beforeClip: { ...clip },
          };
          break;
        }
        case "clip-right-edge": {
          const clip = state.clips[hit.clipId];
          if (clip === undefined) break;
          state.setSelectedClipIds([hit.clipId]);
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = {
            kind: "trim-right",
            clipId: hit.clipId,
            startX: x,
            originalEnd: clip.startTime + clip.duration,
            originalStart: clip.startTime,
            beforeClip: { ...clip },
          };
          break;
        }
        case "ruler": {
          const rulerTime = Math.max(0, hit.timeSeconds);
          state.setCursor(rulerTime);
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { kind: "loop-drag", startSeconds: rulerTime };
          break;
        }
        case "empty-lane": {
          if (!e.shiftKey) {
            state.setSelectedClipIds([]);
          }
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { kind: "rubber-band", startX: x, startY: y };
          break;
        }
        case "track-delete-button": {
          const cmd = new RemoveTrackCommand(hit.trackId);
          cmd.execute();
          sharedUndoManager.push(cmd);
          break;
        }
        case "track-header": {
          if (e.shiftKey) {
            const current = [...state.selectedTrackIds];
            const idx = current.indexOf(hit.trackId);
            if (idx >= 0) {
              current.splice(idx, 1);
            } else {
              current.push(hit.trackId);
            }
            state.setSelectedTrackIds(current);
          } else {
            state.setSelectedTrackIds([hit.trackId]);
          }
          break;
        }
        case "none":
          break;
      }
    },
    [view, getCanvasPos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const { x, y } = getCanvasPos(e);
      const drag = dragRef.current;
      const state = useDawStore.getState();

      if (drag.kind === "idle") {
        const hit = hitTest(x, y, view, state.tracks, state.clips);
        switch (hit.kind) {
          case "clip-left-edge":
          case "clip-right-edge":
            setCursor("ew-resize");
            break;
          case "clip-body":
            setCursor("grab");
            break;
          default:
            setCursor("default");
            break;
        }
        return;
      }

      switch (drag.kind) {
        case "move-clip": {
          setCursor("grabbing");
          const deltaPx = x - drag.startX;
          const deltaSec = deltaPx / view.pixelsPerSecond;
          const newTime = snapToGrid(
            Math.max(0, drag.startTime + deltaSec),
            state.bpm,
            gridSnap,
          );

          const trackIndex = Math.floor(
            (y - RULER_HEIGHT + view.scrollY) / view.trackHeight,
          );
          const targetTrack = state.tracks[trackIndex];
          const targetTrackId =
            targetTrack !== undefined ? targetTrack.id : drag.originTrackId;

          state.moveClip(drag.clipId, newTime, targetTrackId);
          break;
        }
        case "trim-left": {
          setCursor("ew-resize");
          const deltaPx = x - drag.startX;
          const deltaSec = deltaPx / view.pixelsPerSecond;
          const newStart = snapToGrid(
            Math.max(0, drag.originalStart + deltaSec),
            state.bpm,
            gridSnap,
          );
          const maxStart = drag.originalStart + drag.originalDuration - 0.01;
          const clampedStart = Math.min(newStart, maxStart);
          state.trimClip(drag.clipId, clampedStart, undefined);
          break;
        }
        case "trim-right": {
          setCursor("ew-resize");
          const deltaPx = x - drag.startX;
          const deltaSec = deltaPx / view.pixelsPerSecond;
          const rawEnd = snapToGrid(
            Math.max(0.01, drag.originalEnd + deltaSec),
            state.bpm,
            gridSnap,
          );
          // Clamp so the end never crosses the clip's start
          const newEnd = Math.max(drag.originalStart + 0.01, rawEnd);
          state.trimClip(drag.clipId, undefined, newEnd);
          break;
        }
        case "rubber-band": {
          const left = Math.min(drag.startX, x);
          const right = Math.max(drag.startX, x);
          const top = Math.min(drag.startY, y);
          const bottom = Math.max(drag.startY, y);

          const selected: string[] = [];
          for (let ti = 0; ti < state.tracks.length; ti++) {
            const track = state.tracks[ti];
            if (track === undefined) continue;
            const trackTop =
              RULER_HEIGHT + ti * view.trackHeight - view.scrollY;
            const trackBottom = trackTop + view.trackHeight;
            if (trackBottom < top || trackTop > bottom) continue;

            for (const clipId of track.clipIds) {
              const clip = state.clips[clipId];
              if (clip === undefined) continue;
              const clipLeft =
                view.headerWidth +
                (clip.startTime - view.scrollX) * view.pixelsPerSecond;
              const clipRight = clipLeft + clip.duration * view.pixelsPerSecond;
              if (clipRight >= left && clipLeft <= right) {
                selected.push(clip.id);
              }
            }
          }
          state.setSelectedClipIds(selected);
          break;
        }
        case "loop-drag": {
          const timeSec = Math.max(0, xToSeconds(x, view));
          const snapped = snapToGrid(timeSec, state.bpm, gridSnap);
          const loopA = drag.startSeconds;
          const loopB = snapped;
          const loopStart = Math.min(loopA, loopB);
          const loopEnd = Math.max(loopA, loopB);
          if (loopEnd - loopStart > 0.01) {
            state.setLoop(true, loopStart, loopEnd);
          }
          break;
        }
      }
    },
    [view, gridSnap, getCanvasPos],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const drag = dragRef.current;

      // Push undo commands for clip-mutating drags
      if (
        drag.kind === "move-clip" ||
        drag.kind === "trim-left" ||
        drag.kind === "trim-right"
      ) {
        const afterClip = useDawStore.getState().clips[drag.clipId];
        const before = drag.beforeClip;

        if (
          afterClip !== undefined &&
          (before.startTime !== afterClip.startTime ||
            before.trackId !== afterClip.trackId ||
            before.duration !== afterClip.duration ||
            (isAudioClip(before) &&
              isAudioClip(afterClip) &&
              before.sourceOffset !== afterClip.sourceOffset))
        ) {
          const clipId = drag.clipId;
          const cmd: UndoCommand =
            drag.kind === "move-clip"
              ? {
                  type: "move-clip-drag",
                  execute() {
                    useDawStore
                      .getState()
                      .moveClip(clipId, afterClip.startTime, afterClip.trackId);
                  },
                  undo() {
                    useDawStore
                      .getState()
                      .moveClip(clipId, before.startTime, before.trackId);
                  },
                  serialize() {
                    return { clipId, before, after: afterClip };
                  },
                }
              : {
                  type: "trim-clip-drag",
                  execute() {
                    useDawStore.setState((s) => ({
                      clips: { ...s.clips, [clipId]: afterClip },
                    }));
                  },
                  undo() {
                    useDawStore.setState((s) => ({
                      clips: { ...s.clips, [clipId]: before },
                    }));
                  },
                  serialize() {
                    return { clipId, before, after: afterClip };
                  },
                };
          sharedUndoManager.push(cmd);
        }
      }

      if (drag.kind !== "idle") {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      dragRef.current = { kind: "idle" };
      setCursor("default");
    },
    [],
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      const { x, y } = getCanvasPos(e);
      const state = useDawStore.getState();
      const hit = hitTest(x, y, view, state.tracks, state.clips);

      if (hit.kind === "clip-body") {
        const clip = state.clips[hit.clipId];
        if (clip !== undefined && isMidiClip(clip)) {
          onOpenPianoRoll?.(hit.clipId);
          return;
        }
        const timeSec = xToSeconds(x, view);
        const cmd = new SplitClipCommand(hit.clipId, timeSec);
        cmd.execute();
        sharedUndoManager.push(cmd);
        return;
      }

      // Double-click on empty lane of instrument/drum track creates a MIDI clip
      if (hit.kind === "empty-lane") {
        const track = state.tracks.find((t) => t.id === hit.trackId);
        if (
          track !== undefined &&
          (track.type === "instrument" || track.type === "drum")
        ) {
          const timeSec = snapToGrid(
            Math.max(0, xToSeconds(x, view)),
            state.bpm,
            gridSnap,
          );
          const barsInSeconds = (60 / state.bpm) * 4; // 1 bar = 4 beats
          const clip: MidiClipModel = {
            type: "midi",
            id: "clip-" + crypto.randomUUID(),
            trackId: track.id,
            startTime: timeSec,
            duration: barsInSeconds,
            noteEvents: [],
            name: "MIDI Clip",
          };
          const cmd = new AddClipCommand(clip);
          cmd.execute();
          sharedUndoManager.push(cmd);
        }
      }
    },
    [view, gridSnap, getCanvasPos, onOpenPianoRoll],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>): void => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      e.preventDefault();
      const state = useDawStore.getState();

      // If clips are selected, delete them (single undo for the batch)
      if (state.selectedClipIds.length > 0) {
        const cmds = state.selectedClipIds.map(
          (id) => new RemoveClipCommand(id),
        );
        const batch = new BatchCommand(cmds);
        batch.execute();
        sharedUndoManager.push(batch);
        state.setSelectedClipIds([]);
        return;
      }

      // If tracks are selected (and no clips selected), delete them
      if (state.selectedTrackIds.length > 0) {
        const cmds = state.selectedTrackIds.map(
          (id) => new RemoveTrackCommand(id),
        );
        const batch = new BatchCommand(cmds);
        batch.execute();
        sharedUndoManager.push(batch);
        state.setSelectedTrackIds([]);
      }
    },
    [],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDoubleClick,
    onKeyDown,
    cursor,
  };
}
