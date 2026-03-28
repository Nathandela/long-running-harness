import { describe, it, expect, beforeEach } from "vitest";
import { useDawStore } from "@state/store";
import type {
  TrackModel,
  MIDINoteEvent,
  MidiClipModel,
  AudioClipModel,
} from "./types";

function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "track-1",
    name: "Track 1",
    type: "instrument",
    color: "#ff2d6f",
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

function makeNoteEvent(overrides: Partial<MIDINoteEvent> = {}): MIDINoteEvent {
  return {
    id: "note-1",
    pitch: 60,
    velocity: 100,
    startTime: 0,
    duration: 0.5,
    ...overrides,
  };
}

function makeMidiClip(overrides: Partial<MidiClipModel> = {}): MidiClipModel {
  return {
    id: "midi-clip-1",
    trackId: "track-1",
    type: "midi",
    startTime: 0,
    duration: 4,
    noteEvents: [],
    name: "MIDI Clip 1",
    ...overrides,
  };
}

function makeAudioClip(
  overrides: Partial<AudioClipModel> = {},
): AudioClipModel {
  return {
    id: "audio-clip-1",
    trackId: "track-1",
    type: "audio",
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 4,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Audio Clip 1",
    ...overrides,
  };
}

function getStore(): ReturnType<typeof useDawStore.getState> {
  return useDawStore.getState();
}

describe("MIDI store extensions", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
      selectedNoteIds: [],
    });
  });

  describe("addMidiClip", () => {
    it("adds a MIDI clip to the clips map", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const clip = makeMidiClip({ id: "mc1", trackId: "t1" });
      getStore().addMidiClip(clip);
      expect(getStore().clips["mc1"]).toBeDefined();
      expect(getStore().clips["mc1"]?.type).toBe("midi");
    });

    it("adds the clip id to the track clipIds", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(makeMidiClip({ id: "mc1", trackId: "t1" }));
      const track = getStore().tracks.find((t) => t.id === "t1");
      expect(track?.clipIds).toContain("mc1");
    });

    it("preserves note events on the stored clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const notes = [
        makeNoteEvent({ id: "n1", pitch: 60 }),
        makeNoteEvent({ id: "n2", pitch: 64 }),
      ];
      getStore().addMidiClip(
        makeMidiClip({ id: "mc1", trackId: "t1", noteEvents: notes }),
      );
      const stored = getStore().clips["mc1"] as MidiClipModel;
      expect(stored.noteEvents).toHaveLength(2);
    });
  });

  describe("removeMidiClip", () => {
    it("removes a MIDI clip from clips map and track", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(makeMidiClip({ id: "mc1", trackId: "t1" }));
      getStore().removeMidiClip("mc1");
      expect(getStore().clips["mc1"]).toBeUndefined();
      const track = getStore().tracks.find((t) => t.id === "t1");
      expect(track?.clipIds).not.toContain("mc1");
    });
  });

  describe("clips record holds both types", () => {
    it("stores audio and midi clips side by side", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeAudioClip({ id: "ac1", trackId: "t1" }));
      getStore().addMidiClip(makeMidiClip({ id: "mc1", trackId: "t1" }));

      expect(getStore().clips["ac1"]?.type).toBe("audio");
      expect(getStore().clips["mc1"]?.type).toBe("midi");
      expect(Object.keys(getStore().clips)).toHaveLength(2);
    });
  });

  describe("addNoteEvent", () => {
    it("adds a note event to an existing MIDI clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(makeMidiClip({ id: "mc1", trackId: "t1" }));

      const note = makeNoteEvent({ id: "n1", pitch: 64 });
      getStore().addNoteEvent("mc1", note);

      const clip = getStore().clips["mc1"] as MidiClipModel;
      expect(clip.noteEvents).toHaveLength(1);
      expect(clip.noteEvents[0]?.pitch).toBe(64);
    });

    it("appends multiple notes", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(makeMidiClip({ id: "mc1", trackId: "t1" }));

      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n2" }));

      const clip = getStore().clips["mc1"] as MidiClipModel;
      expect(clip.noteEvents).toHaveLength(2);
    });
  });

  describe("removeNoteEvent", () => {
    it("removes a note event by id", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(
        makeMidiClip({
          id: "mc1",
          trackId: "t1",
          noteEvents: [
            makeNoteEvent({ id: "n1" }),
            makeNoteEvent({ id: "n2" }),
          ],
        }),
      );

      getStore().removeNoteEvent("mc1", "n1");
      const clip = getStore().clips["mc1"] as MidiClipModel;
      expect(clip.noteEvents).toHaveLength(1);
      expect(clip.noteEvents[0]?.id).toBe("n2");
    });
  });

  describe("moveNoteEvent", () => {
    it("updates startTime and pitch of a note", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(
        makeMidiClip({
          id: "mc1",
          trackId: "t1",
          noteEvents: [makeNoteEvent({ id: "n1", startTime: 0, pitch: 60 })],
        }),
      );

      getStore().moveNoteEvent("mc1", "n1", 1.5, 72);
      const clip = getStore().clips["mc1"] as MidiClipModel;
      const note = clip.noteEvents.find((n) => n.id === "n1");
      expect(note?.startTime).toBe(1.5);
      expect(note?.pitch).toBe(72);
    });

    it("preserves other note fields when moving", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(
        makeMidiClip({
          id: "mc1",
          trackId: "t1",
          noteEvents: [
            makeNoteEvent({
              id: "n1",
              velocity: 90,
              duration: 0.25,
            }),
          ],
        }),
      );

      getStore().moveNoteEvent("mc1", "n1", 2.0, 65);
      const clip = getStore().clips["mc1"] as MidiClipModel;
      const note = clip.noteEvents.find((n) => n.id === "n1");
      expect(note?.velocity).toBe(90);
      expect(note?.duration).toBe(0.25);
    });
  });

  describe("resizeNoteEvent", () => {
    it("changes the duration of a note", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(
        makeMidiClip({
          id: "mc1",
          trackId: "t1",
          noteEvents: [makeNoteEvent({ id: "n1", duration: 0.5 })],
        }),
      );

      getStore().resizeNoteEvent("mc1", "n1", 1.0);
      const clip = getStore().clips["mc1"] as MidiClipModel;
      const note = clip.noteEvents.find((n) => n.id === "n1");
      expect(note?.duration).toBe(1.0);
    });

    it("preserves other note fields when resizing", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(
        makeMidiClip({
          id: "mc1",
          trackId: "t1",
          noteEvents: [makeNoteEvent({ id: "n1", pitch: 72, startTime: 1.0 })],
        }),
      );

      getStore().resizeNoteEvent("mc1", "n1", 2.0);
      const clip = getStore().clips["mc1"] as MidiClipModel;
      const note = clip.noteEvents.find((n) => n.id === "n1");
      expect(note?.pitch).toBe(72);
      expect(note?.startTime).toBe(1.0);
    });
  });

  describe("updateNoteVelocity", () => {
    it("changes the velocity of a note", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(
        makeMidiClip({
          id: "mc1",
          trackId: "t1",
          noteEvents: [makeNoteEvent({ id: "n1", velocity: 100 })],
        }),
      );

      getStore().updateNoteVelocity("mc1", "n1", 50);
      const clip = getStore().clips["mc1"] as MidiClipModel;
      const note = clip.noteEvents.find((n) => n.id === "n1");
      expect(note?.velocity).toBe(50);
    });

    it("preserves other note fields when changing velocity", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addMidiClip(
        makeMidiClip({
          id: "mc1",
          trackId: "t1",
          noteEvents: [
            makeNoteEvent({
              id: "n1",
              pitch: 60,
              startTime: 0.5,
              duration: 1.0,
            }),
          ],
        }),
      );

      getStore().updateNoteVelocity("mc1", "n1", 127);
      const clip = getStore().clips["mc1"] as MidiClipModel;
      const note = clip.noteEvents.find((n) => n.id === "n1");
      expect(note?.pitch).toBe(60);
      expect(note?.startTime).toBe(0.5);
      expect(note?.duration).toBe(1.0);
    });
  });

  describe("setSelectedNoteIds", () => {
    it("sets note selection", () => {
      getStore().setSelectedNoteIds(["n1", "n2"]);
      expect(getStore().selectedNoteIds).toEqual(["n1", "n2"]);
    });

    it("clears note selection with empty array", () => {
      getStore().setSelectedNoteIds(["n1"]);
      getStore().setSelectedNoteIds([]);
      expect(getStore().selectedNoteIds).toEqual([]);
    });
  });
});
