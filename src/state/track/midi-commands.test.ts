import { describe, it, expect, beforeEach } from "vitest";
import { useDawStore } from "@state/store";
import type { TrackModel, MIDINoteEvent, MidiClipModel } from "./types";
import {
  AddNoteCommand,
  RemoveNoteCommand,
  MoveNoteCommand,
  ResizeNoteCommand,
  BatchNoteCommand,
} from "./midi-commands";

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

function getStore(): ReturnType<typeof useDawStore.getState> {
  return useDawStore.getState();
}

function getClipNotes(clipId: string): readonly MIDINoteEvent[] {
  const clip = getStore().clips[clipId] as MidiClipModel | undefined;
  expect(clip).toBeDefined();
  return clip?.noteEvents ?? [];
}

describe("MIDI note commands", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
      selectedNoteIds: [],
    });
    getStore().addTrack(makeTrack({ id: "t1" }));
    getStore().addMidiClip(makeMidiClip({ id: "mc1", trackId: "t1" }));
  });

  describe("AddNoteCommand", () => {
    it("execute adds a note to the clip", () => {
      const note = makeNoteEvent({ id: "n1", pitch: 64 });
      const cmd = new AddNoteCommand("mc1", note);
      cmd.execute();

      const notes = getClipNotes("mc1");
      expect(notes).toHaveLength(1);
      expect(notes[0]?.pitch).toBe(64);
    });

    it("undo removes the added note", () => {
      const note = makeNoteEvent({ id: "n1" });
      const cmd = new AddNoteCommand("mc1", note);
      cmd.execute();
      cmd.undo();

      expect(getClipNotes("mc1")).toHaveLength(0);
    });

    it("has type add-note", () => {
      const cmd = new AddNoteCommand("mc1", makeNoteEvent());
      expect(cmd.type).toBe("add-note");
    });

    it("serializes clipId and note", () => {
      const note = makeNoteEvent({ id: "n1" });
      const cmd = new AddNoteCommand("mc1", note);
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("mc1");
      expect(data["note"]).toEqual(note);
    });
  });

  describe("RemoveNoteCommand", () => {
    it("execute removes a note from the clip", () => {
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n2" }));

      const cmd = new RemoveNoteCommand("mc1", "n1");
      cmd.execute();

      const notes = getClipNotes("mc1");
      expect(notes).toHaveLength(1);
      expect(notes[0]?.id).toBe("n2");
    });

    it("undo restores the removed note", () => {
      const note = makeNoteEvent({ id: "n1", pitch: 72 });
      getStore().addNoteEvent("mc1", note);

      const cmd = new RemoveNoteCommand("mc1", "n1");
      cmd.execute();
      cmd.undo();

      const notes = getClipNotes("mc1");
      expect(notes).toHaveLength(1);
      expect(notes[0]?.pitch).toBe(72);
    });

    it("has type remove-note", () => {
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      const cmd = new RemoveNoteCommand("mc1", "n1");
      expect(cmd.type).toBe("remove-note");
    });

    it("serializes clipId and noteId", () => {
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      const cmd = new RemoveNoteCommand("mc1", "n1");
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("mc1");
      expect(data["noteId"]).toBe("n1");
    });
  });

  describe("MoveNoteCommand", () => {
    it("execute moves a note to new startTime and pitch", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", startTime: 0, pitch: 60 }),
      );

      const cmd = new MoveNoteCommand("mc1", "n1", 2.0, 72);
      cmd.execute();

      const note = getClipNotes("mc1").find((n) => n.id === "n1");
      expect(note?.startTime).toBe(2.0);
      expect(note?.pitch).toBe(72);
    });

    it("undo restores original startTime and pitch", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", startTime: 1.0, pitch: 64 }),
      );

      const cmd = new MoveNoteCommand("mc1", "n1", 3.0, 80);
      cmd.execute();
      cmd.undo();

      const note = getClipNotes("mc1").find((n) => n.id === "n1");
      expect(note?.startTime).toBe(1.0);
      expect(note?.pitch).toBe(64);
    });

    it("preserves velocity and duration after move", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", velocity: 90, duration: 0.75 }),
      );

      const cmd = new MoveNoteCommand("mc1", "n1", 1.0, 67);
      cmd.execute();

      const note = getClipNotes("mc1").find((n) => n.id === "n1");
      expect(note?.velocity).toBe(90);
      expect(note?.duration).toBe(0.75);
    });

    it("has type move-note", () => {
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      const cmd = new MoveNoteCommand("mc1", "n1", 1.0, 60);
      expect(cmd.type).toBe("move-note");
    });

    it("serializes all fields", () => {
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      const cmd = new MoveNoteCommand("mc1", "n1", 2.0, 72);
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("mc1");
      expect(data["noteId"]).toBe("n1");
      expect(data["newStartTime"]).toBe(2.0);
      expect(data["newPitch"]).toBe(72);
    });
  });

  describe("ResizeNoteCommand", () => {
    it("execute changes the note duration", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", duration: 0.5 }),
      );

      const cmd = new ResizeNoteCommand("mc1", "n1", 2.0);
      cmd.execute();

      const note = getClipNotes("mc1").find((n) => n.id === "n1");
      expect(note?.duration).toBe(2.0);
    });

    it("undo restores original duration", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", duration: 0.5 }),
      );

      const cmd = new ResizeNoteCommand("mc1", "n1", 2.0);
      cmd.execute();
      cmd.undo();

      const note = getClipNotes("mc1").find((n) => n.id === "n1");
      expect(note?.duration).toBe(0.5);
    });

    it("preserves pitch and startTime after resize", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", pitch: 60, startTime: 1.0 }),
      );

      const cmd = new ResizeNoteCommand("mc1", "n1", 3.0);
      cmd.execute();

      const note = getClipNotes("mc1").find((n) => n.id === "n1");
      expect(note?.pitch).toBe(60);
      expect(note?.startTime).toBe(1.0);
    });

    it("has type resize-note", () => {
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      const cmd = new ResizeNoteCommand("mc1", "n1", 1.0);
      expect(cmd.type).toBe("resize-note");
    });

    it("serializes clipId, noteId, and newDuration", () => {
      getStore().addNoteEvent("mc1", makeNoteEvent({ id: "n1" }));
      const cmd = new ResizeNoteCommand("mc1", "n1", 1.5);
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("mc1");
      expect(data["noteId"]).toBe("n1");
      expect(data["newDuration"]).toBe(1.5);
    });
  });

  describe("BatchNoteCommand", () => {
    it("execute runs all sub-commands in order", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", startTime: 0, pitch: 60 }),
      );
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n2", startTime: 0.5, pitch: 64 }),
      );

      const cmd = new BatchNoteCommand([
        new MoveNoteCommand("mc1", "n1", 1.0, 62),
        new MoveNoteCommand("mc1", "n2", 1.5, 66),
      ]);
      cmd.execute();

      const notes = getClipNotes("mc1");
      const n1 = notes.find((n) => n.id === "n1");
      const n2 = notes.find((n) => n.id === "n2");
      expect(n1?.startTime).toBe(1.0);
      expect(n1?.pitch).toBe(62);
      expect(n2?.startTime).toBe(1.5);
      expect(n2?.pitch).toBe(66);
    });

    it("undo reverses all sub-commands in reverse order", () => {
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n1", startTime: 0, pitch: 60 }),
      );
      getStore().addNoteEvent(
        "mc1",
        makeNoteEvent({ id: "n2", startTime: 0.5, pitch: 64 }),
      );

      const cmd = new BatchNoteCommand([
        new MoveNoteCommand("mc1", "n1", 1.0, 62),
        new MoveNoteCommand("mc1", "n2", 1.5, 66),
      ]);
      cmd.execute();
      cmd.undo();

      const notes = getClipNotes("mc1");
      const n1 = notes.find((n) => n.id === "n1");
      const n2 = notes.find((n) => n.id === "n2");
      expect(n1?.startTime).toBe(0);
      expect(n1?.pitch).toBe(60);
      expect(n2?.startTime).toBe(0.5);
      expect(n2?.pitch).toBe(64);
    });

    it("works with mixed command types", () => {
      const cmd = new BatchNoteCommand([
        new AddNoteCommand("mc1", makeNoteEvent({ id: "n1", pitch: 60 })),
        new AddNoteCommand("mc1", makeNoteEvent({ id: "n2", pitch: 64 })),
      ]);
      cmd.execute();
      expect(getClipNotes("mc1")).toHaveLength(2);

      cmd.undo();
      expect(getClipNotes("mc1")).toHaveLength(0);
    });

    it("has type batch-note", () => {
      const cmd = new BatchNoteCommand([]);
      expect(cmd.type).toBe("batch-note");
    });

    it("serializes sub-commands", () => {
      const sub1 = new AddNoteCommand("mc1", makeNoteEvent({ id: "n1" }));
      const cmd = new BatchNoteCommand([sub1]);
      const data = cmd.serialize();
      expect(data["commands"]).toBeDefined();
      expect(Array.isArray(data["commands"])).toBe(true);
    });
  });
});
