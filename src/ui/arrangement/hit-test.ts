/**
 * Hit-testing utilities for the arrangement canvas.
 * Converts pixel coordinates to track/clip references.
 */
import type { ClipModel, TrackModel } from "@state/track/types";
import type { ArrangementViewState } from "./arrangement-renderer";
import { RULER_HEIGHT, CLIP_PADDING, TRIM_HANDLE_PX } from "./constants";

export type HitResult =
  | { kind: "none" }
  | { kind: "track-header"; trackIndex: number; trackId: string }
  | { kind: "clip-body"; clipId: string; trackId: string }
  | { kind: "clip-left-edge"; clipId: string; trackId: string }
  | { kind: "clip-right-edge"; clipId: string; trackId: string }
  | { kind: "ruler"; timeSeconds: number }
  | { kind: "empty-lane"; trackIndex: number; trackId: string };

export type GridSnap = "1/4" | "1/8" | "1/16" | "1-bar";

export function snapToGrid(
  seconds: number,
  bpm: number,
  snap: GridSnap,
): number {
  const secPerBeat = 60 / bpm;
  let gridSize: number;
  switch (snap) {
    case "1-bar":
      gridSize = secPerBeat * 4;
      break;
    case "1/4":
      gridSize = secPerBeat;
      break;
    case "1/8":
      gridSize = secPerBeat / 2;
      break;
    case "1/16":
      gridSize = secPerBeat / 4;
      break;
  }
  return Math.round(seconds / gridSize) * gridSize;
}

export function xToSeconds(x: number, view: ArrangementViewState): number {
  return view.scrollX + (x - view.headerWidth) / view.pixelsPerSecond;
}

export function hitTest(
  x: number,
  y: number,
  view: ArrangementViewState,
  tracks: readonly TrackModel[],
  clips: Record<string, ClipModel>,
): HitResult {
  // Ruler area
  if (y < RULER_HEIGHT) {
    return { kind: "ruler", timeSeconds: xToSeconds(x, view) };
  }

  // Track header area
  if (x < view.headerWidth) {
    const trackIndex = Math.floor(
      (y - RULER_HEIGHT + view.scrollY) / view.trackHeight,
    );
    const track = tracks[trackIndex];
    if (track !== undefined) {
      return { kind: "track-header", trackIndex, trackId: track.id };
    }
    return { kind: "none" };
  }

  // Timeline area
  const trackIndex = Math.floor(
    (y - RULER_HEIGHT + view.scrollY) / view.trackHeight,
  );
  const track = tracks[trackIndex];
  if (track === undefined) return { kind: "none" };

  const trackY = RULER_HEIGHT + trackIndex * view.trackHeight - view.scrollY;

  // Check clips in this track (reverse order for front-to-back priority)
  for (let i = track.clipIds.length - 1; i >= 0; i--) {
    const clipId = track.clipIds[i];
    if (clipId === undefined) continue;
    const clip = clips[clipId];
    if (clip === undefined) continue;

    const clipX =
      view.headerWidth + (clip.startTime - view.scrollX) * view.pixelsPerSecond;
    const clipW = clip.duration * view.pixelsPerSecond;
    const clipY = trackY + CLIP_PADDING;
    const clipH = view.trackHeight - CLIP_PADDING * 2;

    if (x >= clipX && x <= clipX + clipW && y >= clipY && y <= clipY + clipH) {
      // Left trim handle
      if (x - clipX < TRIM_HANDLE_PX) {
        return { kind: "clip-left-edge", clipId: clip.id, trackId: track.id };
      }
      // Right trim handle
      if (clipX + clipW - x < TRIM_HANDLE_PX) {
        return { kind: "clip-right-edge", clipId: clip.id, trackId: track.id };
      }
      return { kind: "clip-body", clipId: clip.id, trackId: track.id };
    }
  }

  return { kind: "empty-lane", trackIndex, trackId: track.id };
}
