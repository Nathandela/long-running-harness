/**
 * Mouse interaction handlers for the arrangement canvas.
 * Manages drag operations for clip move, trim, split, duplicate, and selection.
 */
import { useCallback, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import type { ArrangementViewState } from "./arrangement-renderer";
import { hitTest, xToSeconds, snapToGrid, type GridSnap } from "./hit-test";

type DragState =
  | { kind: "idle" }
  | {
      kind: "move-clip";
      clipId: string;
      originTrackId: string;
      startX: number;
      startTime: number;
    }
  | {
      kind: "trim-left";
      clipId: string;
      startX: number;
      originalStart: number;
      originalSourceOffset: number;
      originalDuration: number;
    }
  | {
      kind: "trim-right";
      clipId: string;
      startX: number;
      originalEnd: number;
    }
  | {
      kind: "rubber-band";
      startX: number;
      startY: number;
    };

export type ArrangementInteractions = {
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  cursor: string;
};

export function useArrangementInteractions(
  view: ArrangementViewState,
  gridSnap: GridSnap,
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

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      const { x, y } = getCanvasPos(e);
      const state = useDawStore.getState();
      const hit = hitTest(x, y, view, state.tracks, state.clips);

      switch (hit.kind) {
        case "clip-body": {
          const clip = state.clips[hit.clipId];
          if (clip === undefined) break;

          if (e.shiftKey) {
            // Multi-select toggle
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

          dragRef.current = {
            kind: "move-clip",
            clipId: hit.clipId,
            originTrackId: clip.trackId,
            startX: x,
            startTime: clip.startTime,
          };
          break;
        }
        case "clip-left-edge": {
          const clip = state.clips[hit.clipId];
          if (clip === undefined) break;
          state.setSelectedClipIds([hit.clipId]);
          dragRef.current = {
            kind: "trim-left",
            clipId: hit.clipId,
            startX: x,
            originalStart: clip.startTime,
            originalSourceOffset: clip.sourceOffset,
            originalDuration: clip.duration,
          };
          break;
        }
        case "clip-right-edge": {
          const clip = state.clips[hit.clipId];
          if (clip === undefined) break;
          state.setSelectedClipIds([hit.clipId]);
          dragRef.current = {
            kind: "trim-right",
            clipId: hit.clipId,
            startX: x,
            originalEnd: clip.startTime + clip.duration,
          };
          break;
        }
        case "ruler": {
          state.setCursor(Math.max(0, hit.timeSeconds));
          break;
        }
        case "empty-lane": {
          if (!e.shiftKey) {
            state.setSelectedClipIds([]);
          }
          dragRef.current = { kind: "rubber-band", startX: x, startY: y };
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

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      const { x, y } = getCanvasPos(e);
      const drag = dragRef.current;
      const state = useDawStore.getState();

      // Update cursor based on hover
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

          // Determine target track
          const trackIndex = Math.floor(
            (y - 24 + view.scrollY) / view.trackHeight,
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
          const newEnd = snapToGrid(
            Math.max(0.01, drag.originalEnd + deltaSec),
            state.bpm,
            gridSnap,
          );
          state.trimClip(drag.clipId, undefined, newEnd);
          break;
        }
        case "rubber-band": {
          // Rubber-band selection: select clips within the rectangle
          const left = Math.min(drag.startX, x);
          const right = Math.max(drag.startX, x);
          const top = Math.min(drag.startY, y);
          const bottom = Math.max(drag.startY, y);

          const selected: string[] = [];
          for (let ti = 0; ti < state.tracks.length; ti++) {
            const track = state.tracks[ti];
            if (track === undefined) continue;
            const trackTop = 24 + ti * view.trackHeight - view.scrollY;
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
      }
    },
    [view, gridSnap, getCanvasPos],
  );

  const onMouseUp = useCallback((): void => {
    dragRef.current = { kind: "idle" };
    setCursor("default");
  }, []);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      const { x, y } = getCanvasPos(e);
      const state = useDawStore.getState();
      const hit = hitTest(x, y, view, state.tracks, state.clips);

      if (hit.kind === "clip-body") {
        // Split clip at cursor position
        const timeSec = xToSeconds(x, view);
        state.splitClip(hit.clipId, timeSec);
      }
    },
    [view, getCanvasPos],
  );

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDoubleClick,
    cursor,
  };
}
