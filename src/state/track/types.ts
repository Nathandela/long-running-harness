/**
 * Core types for the track system.
 * Tracks contain clips; clips are non-destructive references to audio sources.
 */

export type TrackType = "audio" | "instrument";

export type TrackModel = {
  readonly id: string;
  readonly name: string;
  readonly type: TrackType;
  readonly color: string;
  readonly muted: boolean;
  readonly solo: boolean;
  readonly armed: boolean;
  readonly volume: number; // 0..2
  readonly pan: number; // -1..1
  readonly clipIds: readonly string[];
};

export type ClipModel = {
  readonly id: string;
  readonly trackId: string;
  readonly sourceId: string;
  readonly startTime: number; // seconds on timeline
  readonly sourceOffset: number; // seconds into source
  readonly duration: number; // seconds
  readonly gain: number; // 0..2
  readonly fadeIn: number; // seconds
  readonly fadeOut: number; // seconds
  readonly name: string;
};
