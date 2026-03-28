/**
 * Core types for the track system.
 * Tracks contain clips; clips are non-destructive references to audio sources
 * or containers for MIDI note events.
 */

export type TrackType = "audio" | "instrument";

export type MIDINoteEvent = {
  readonly id: string;
  readonly pitch: number; // 0-127
  readonly velocity: number; // 0-127
  readonly startTime: number; // seconds, relative to clip start
  readonly duration: number; // seconds
};

export type AudioClipModel = {
  readonly type: "audio";
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

export type MidiClipModel = {
  readonly type: "midi";
  readonly id: string;
  readonly trackId: string;
  readonly startTime: number; // seconds on timeline
  readonly duration: number; // seconds
  readonly noteEvents: readonly MIDINoteEvent[];
  readonly name: string;
};

export type ClipModel = AudioClipModel | MidiClipModel;

export function isAudioClip(clip: ClipModel): clip is AudioClipModel {
  return clip.type === "audio";
}

export function isMidiClip(clip: ClipModel): clip is MidiClipModel {
  return clip.type === "midi";
}

export type TrackModel = {
  readonly id: string;
  readonly name: string;
  readonly type: TrackType;
  readonly color: string;
  readonly muted: boolean;
  readonly solo: boolean;
  readonly armed: boolean;
  readonly soloIsolate: boolean;
  readonly volume: number; // 0..2
  readonly pan: number; // -1..1
  readonly clipIds: readonly string[];
};
