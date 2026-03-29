import { create } from "zustand";
import type {
  TrackModel,
  ClipModel,
  MidiClipModel,
  MIDINoteEvent,
} from "./track/types";
import { isAudioClip, isMidiClip } from "./track/types";

export type TransportState = "stopped" | "playing" | "paused";

export type AudioEngineStatus =
  | "uninitialized"
  | "suspended"
  | "running"
  | "error";

export type DawStore = {
  // Transport
  transportState: TransportState;
  bpm: number;
  cursorSeconds: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;

  // Audio engine
  engineStatus: AudioEngineStatus;

  // Mixer
  masterVolume: number;

  // Tracks & clips
  tracks: readonly TrackModel[];
  clips: Record<string, ClipModel>;
  selectedTrackIds: readonly string[];
  selectedClipIds: readonly string[];
  selectedNoteIds: readonly string[];

  // Transport actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setCursor: (seconds: number) => void;
  setLoop: (enabled: boolean, start?: number, end?: number) => void;

  // Engine actions
  setEngineStatus: (status: AudioEngineStatus) => void;

  // Mixer actions
  setMasterVolume: (volume: number) => void;

  // Track actions
  addTrack: (track: TrackModel, index?: number) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, patch: Partial<Omit<TrackModel, "id">>) => void;
  reorderTrack: (id: string, toIndex: number) => void;

  // Clip actions
  addClip: (clip: ClipModel) => void;
  removeClip: (id: string) => void;
  moveClip: (id: string, startTime: number, toTrackId?: string) => void;
  splitClip: (
    id: string,
    atTime: number,
    providedId?: string,
  ) => string | undefined;
  trimClip: (id: string, newStart?: number, newEnd?: number) => void;
  duplicateClip: (id: string, providedId?: string) => string | undefined;

  // MIDI clip actions
  addMidiClip: (clip: MidiClipModel) => void;
  removeMidiClip: (id: string) => void;
  addNoteEvent: (clipId: string, note: MIDINoteEvent) => void;
  removeNoteEvent: (clipId: string, noteId: string) => void;
  moveNoteEvent: (
    clipId: string,
    noteId: string,
    newStartTime: number,
    newPitch: number,
  ) => void;
  resizeNoteEvent: (
    clipId: string,
    noteId: string,
    newDuration: number,
  ) => void;
  updateNoteVelocity: (
    clipId: string,
    noteId: string,
    velocity: number,
  ) => void;

  // Selection actions
  setSelectedTrackIds: (ids: readonly string[]) => void;
  setSelectedClipIds: (ids: readonly string[]) => void;
  setSelectedNoteIds: (ids: readonly string[]) => void;

  // Query
  queryClipsAtTime: (time: number) => readonly ClipModel[];
};

function nextClipId(): string {
  return "clip-" + crypto.randomUUID();
}

export const useDawStore = create<DawStore>()((set, get) => ({
  // Transport defaults
  transportState: "stopped",
  bpm: 120,
  cursorSeconds: 0,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,

  // Engine defaults
  engineStatus: "uninitialized",

  // Mixer defaults
  masterVolume: 1,

  // Track & clip defaults
  tracks: [],
  clips: {},
  selectedTrackIds: [],
  selectedClipIds: [],
  selectedNoteIds: [],

  // Transport actions
  play: () => {
    set({ transportState: "playing" });
  },
  pause: () => {
    set({ transportState: "paused" });
  },
  stop: () => {
    set({ transportState: "stopped", cursorSeconds: 0 });
  },
  setBpm: (bpm: number) => {
    const clamped = Math.min(999, Math.max(20, bpm));
    if (!Number.isFinite(clamped)) return;
    set({ bpm: clamped });
  },
  setCursor: (seconds: number) => {
    set({ cursorSeconds: seconds });
  },
  setLoop: (enabled: boolean, start?: number, end?: number) => {
    set((state) => ({
      loopEnabled: enabled,
      loopStart: start ?? state.loopStart,
      loopEnd: end ?? state.loopEnd,
    }));
  },

  // Engine actions
  setEngineStatus: (status: AudioEngineStatus) => {
    set({ engineStatus: status });
  },

  // Mixer actions
  setMasterVolume: (volume: number) => {
    const clamped = Math.min(2, Math.max(0, volume));
    set({ masterVolume: clamped });
  },

  // Track actions
  addTrack: (track: TrackModel, index?: number) => {
    set((state) => {
      const next = [...state.tracks];
      if (index !== undefined) {
        next.splice(index, 0, track);
      } else {
        next.push(track);
      }
      return { tracks: next };
    });
  },

  removeTrack: (id: string) => {
    set((state) => {
      const track = state.tracks.find((t) => t.id === id);
      if (!track) return state;
      const removeSet = new Set(track.clipIds);
      const nextClips = Object.fromEntries(
        Object.entries(state.clips).filter(([k]) => !removeSet.has(k)),
      );
      return {
        tracks: state.tracks.filter((t) => t.id !== id),
        clips: nextClips,
      };
    });
  },

  updateTrack: (id: string, patch: Partial<Omit<TrackModel, "id">>) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  },

  reorderTrack: (id: string, toIndex: number) => {
    set((state) => {
      const fromIndex = state.tracks.findIndex((t) => t.id === id);
      if (fromIndex === -1) return state;
      const next = [...state.tracks];
      const moved = next.splice(fromIndex, 1)[0];
      if (moved === undefined) return state;
      next.splice(toIndex, 0, moved);
      return { tracks: next };
    });
  },

  // Clip actions
  addClip: (clip: ClipModel) => {
    set((state) => {
      const nextClips = { ...state.clips, [clip.id]: clip };
      const tracks = state.tracks.map((t) =>
        t.id === clip.trackId ? { ...t, clipIds: [...t.clipIds, clip.id] } : t,
      );
      return { clips: nextClips, tracks };
    });
  },

  removeClip: (id: string) => {
    set((state) => {
      const clip = state.clips[id];
      if (!clip) return state;
      const nextClips = Object.fromEntries(
        Object.entries(state.clips).filter(([k]) => k !== id),
      );
      const tracks = state.tracks.map((t) =>
        t.id === clip.trackId
          ? { ...t, clipIds: t.clipIds.filter((cid) => cid !== id) }
          : t,
      );
      return { clips: nextClips, tracks };
    });
  },

  moveClip: (id: string, startTime: number, toTrackId?: string) => {
    set((state) => {
      const clip = state.clips[id];
      if (!clip) return state;
      // Validate target track exists
      if (
        toTrackId !== undefined &&
        !state.tracks.some((t) => t.id === toTrackId)
      ) {
        return state;
      }
      const updatedClip = {
        ...clip,
        startTime,
        trackId: toTrackId ?? clip.trackId,
      };
      const nextClips = { ...state.clips, [id]: updatedClip };

      let tracks = state.tracks;
      if (toTrackId !== undefined && toTrackId !== clip.trackId) {
        tracks = tracks.map((t) => {
          if (t.id === clip.trackId) {
            return { ...t, clipIds: t.clipIds.filter((cid) => cid !== id) };
          }
          if (t.id === toTrackId) {
            return { ...t, clipIds: [...t.clipIds, id] };
          }
          return t;
        });
      }
      return { clips: nextClips, tracks };
    });
  },

  splitClip: (
    id: string,
    atTime: number,
    providedId?: string,
  ): string | undefined => {
    const state = get();
    const clip = state.clips[id];
    if (!clip) return undefined;
    if (!isAudioClip(clip)) return undefined;

    const clipEnd = clip.startTime + clip.duration;
    if (atTime <= clip.startTime || atTime >= clipEnd) return undefined;

    const leftDuration = atTime - clip.startTime;
    const rightDuration = clip.duration - leftDuration;
    const rightSourceOffset = clip.sourceOffset + leftDuration;

    const newId = providedId ?? nextClipId();

    const leftClip: ClipModel = { ...clip, duration: leftDuration };
    const rightClip: ClipModel = {
      ...clip,
      id: newId,
      startTime: atTime,
      sourceOffset: rightSourceOffset,
      duration: rightDuration,
    };

    set((s) => {
      const nextClips = { ...s.clips, [id]: leftClip, [newId]: rightClip };
      const tracks = s.tracks.map((t) =>
        t.id === clip.trackId ? { ...t, clipIds: [...t.clipIds, newId] } : t,
      );
      return { clips: nextClips, tracks };
    });

    return newId;
  },

  trimClip: (id: string, newStart?: number, newEnd?: number) => {
    set((state) => {
      const clip = state.clips[id];
      if (!clip) return state;
      if (!isAudioClip(clip)) return state;

      let { startTime, sourceOffset, duration } = clip;
      const clipEnd = startTime + duration;

      if (newStart !== undefined) {
        const delta = newStart - startTime;
        startTime = newStart;
        sourceOffset = sourceOffset + delta;
        duration = clipEnd - newStart;
      }

      if (newEnd !== undefined) {
        duration = newEnd - startTime;
      }

      // Guard against invalid state
      if (duration <= 0 || sourceOffset < 0) return state;

      return {
        clips: {
          ...state.clips,
          [id]: { ...clip, startTime, sourceOffset, duration },
        },
      };
    });
  },

  duplicateClip: (id: string, providedId?: string): string | undefined => {
    const state = get();
    const clip = state.clips[id];
    if (!clip) return undefined;

    const newId = providedId ?? nextClipId();
    const duplicate: ClipModel = {
      ...clip,
      id: newId,
      startTime: clip.startTime + clip.duration,
    };

    set((s) => {
      const nextClips = { ...s.clips, [newId]: duplicate };
      const tracks = s.tracks.map((t) =>
        t.id === clip.trackId ? { ...t, clipIds: [...t.clipIds, newId] } : t,
      );
      return { clips: nextClips, tracks };
    });

    return newId;
  },

  // MIDI clip actions
  addMidiClip: (clip: MidiClipModel) => {
    set((state) => {
      const nextClips = { ...state.clips, [clip.id]: clip };
      const tracks = state.tracks.map((t) =>
        t.id === clip.trackId ? { ...t, clipIds: [...t.clipIds, clip.id] } : t,
      );
      return { clips: nextClips, tracks };
    });
  },

  removeMidiClip: (id: string) => {
    set((state) => {
      const clip = state.clips[id];
      if (!clip) return state;
      const nextClips = Object.fromEntries(
        Object.entries(state.clips).filter(([k]) => k !== id),
      );
      const tracks = state.tracks.map((t) =>
        t.id === clip.trackId
          ? { ...t, clipIds: t.clipIds.filter((cid) => cid !== id) }
          : t,
      );
      return { clips: nextClips, tracks };
    });
  },

  addNoteEvent: (clipId: string, note: MIDINoteEvent) => {
    set((state) => {
      const clip = state.clips[clipId];
      if (!clip || !isMidiClip(clip)) return state;
      const clamped: MIDINoteEvent = {
        ...note,
        pitch: Math.max(0, Math.min(127, Math.round(note.pitch))),
        velocity: Math.max(0, Math.min(127, Math.round(note.velocity))),
        startTime: Math.max(0, note.startTime),
        duration: Math.max(0.01, note.duration),
      };
      const updated: MidiClipModel = {
        ...clip,
        noteEvents: [...clip.noteEvents, clamped],
      };
      return { clips: { ...state.clips, [clipId]: updated } };
    });
  },

  removeNoteEvent: (clipId: string, noteId: string) => {
    set((state) => {
      const clip = state.clips[clipId];
      if (!clip || !isMidiClip(clip)) return state;
      const updated: MidiClipModel = {
        ...clip,
        noteEvents: clip.noteEvents.filter((n) => n.id !== noteId),
      };
      return { clips: { ...state.clips, [clipId]: updated } };
    });
  },

  moveNoteEvent: (
    clipId: string,
    noteId: string,
    newStartTime: number,
    newPitch: number,
  ) => {
    set((state) => {
      const clip = state.clips[clipId];
      if (!clip || !isMidiClip(clip)) return state;
      const clampedPitch = Math.max(0, Math.min(127, Math.round(newPitch)));
      const clampedStartTime = Math.max(0, newStartTime);
      const updated: MidiClipModel = {
        ...clip,
        noteEvents: clip.noteEvents.map((n) =>
          n.id === noteId
            ? { ...n, startTime: clampedStartTime, pitch: clampedPitch }
            : n,
        ),
      };
      return { clips: { ...state.clips, [clipId]: updated } };
    });
  },

  resizeNoteEvent: (clipId: string, noteId: string, newDuration: number) => {
    set((state) => {
      const clip = state.clips[clipId];
      if (!clip || !isMidiClip(clip)) return state;
      const clampedDuration = Math.max(0.01, newDuration);
      const updated: MidiClipModel = {
        ...clip,
        noteEvents: clip.noteEvents.map((n) =>
          n.id === noteId ? { ...n, duration: clampedDuration } : n,
        ),
      };
      return { clips: { ...state.clips, [clipId]: updated } };
    });
  },

  updateNoteVelocity: (clipId: string, noteId: string, velocity: number) => {
    set((state) => {
      const clip = state.clips[clipId];
      if (!clip || !isMidiClip(clip)) return state;
      const clampedVelocity = Math.max(0, Math.min(127, Math.round(velocity)));
      const updated: MidiClipModel = {
        ...clip,
        noteEvents: clip.noteEvents.map((n) =>
          n.id === noteId ? { ...n, velocity: clampedVelocity } : n,
        ),
      };
      return { clips: { ...state.clips, [clipId]: updated } };
    });
  },

  // Selection
  setSelectedTrackIds: (ids: readonly string[]) => {
    set({ selectedTrackIds: ids });
  },
  setSelectedClipIds: (ids: readonly string[]) => {
    set({ selectedClipIds: ids });
  },
  setSelectedNoteIds: (ids: readonly string[]) => {
    set({ selectedNoteIds: ids });
  },

  // Query
  queryClipsAtTime: (time: number): readonly ClipModel[] => {
    const state = get();
    const hasSolo = state.tracks.some((t) => t.solo);
    const activeTracks = new Set(
      state.tracks
        .filter((t) => {
          if (t.muted) return false;
          if (hasSolo && !t.solo && !t.soloIsolate) return false;
          return true;
        })
        .map((t) => t.id),
    );

    return Object.values(state.clips).filter((clip) => {
      if (!activeTracks.has(clip.trackId)) return false;
      const clipEnd = clip.startTime + clip.duration;
      return time >= clip.startTime && time < clipEnd;
    });
  },
}));
