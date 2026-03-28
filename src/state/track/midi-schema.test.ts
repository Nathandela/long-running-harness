import { describe, it, expect } from "vitest";
import {
  noteEventSchema,
  midiClipSchema,
  audioClipSchema,
  clipSchema,
} from "./track-schema";

describe("noteEventSchema", () => {
  const validNote = {
    id: "note-1",
    pitch: 60,
    velocity: 100,
    startTime: 0,
    duration: 0.5,
  };

  it("accepts a valid note event", () => {
    expect(noteEventSchema.safeParse(validNote).success).toBe(true);
  });

  it("accepts pitch at boundaries (0 and 127)", () => {
    expect(noteEventSchema.safeParse({ ...validNote, pitch: 0 }).success).toBe(
      true,
    );
    expect(
      noteEventSchema.safeParse({ ...validNote, pitch: 127 }).success,
    ).toBe(true);
  });

  it("rejects negative pitch", () => {
    expect(noteEventSchema.safeParse({ ...validNote, pitch: -1 }).success).toBe(
      false,
    );
  });

  it("rejects pitch above 127", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, pitch: 128 }).success,
    ).toBe(false);
  });

  it("rejects non-integer pitch", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, pitch: 60.5 }).success,
    ).toBe(false);
  });

  it("accepts velocity at boundaries (0 and 127)", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, velocity: 0 }).success,
    ).toBe(true);
    expect(
      noteEventSchema.safeParse({ ...validNote, velocity: 127 }).success,
    ).toBe(true);
  });

  it("rejects negative velocity", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, velocity: -1 }).success,
    ).toBe(false);
  });

  it("rejects velocity above 127", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, velocity: 128 }).success,
    ).toBe(false);
  });

  it("accepts startTime of zero", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, startTime: 0 }).success,
    ).toBe(true);
  });

  it("rejects negative startTime", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, startTime: -0.5 }).success,
    ).toBe(false);
  });

  it("rejects zero duration", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, duration: 0 }).success,
    ).toBe(false);
  });

  it("rejects negative duration", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, duration: -1 }).success,
    ).toBe(false);
  });

  it("accepts small positive duration", () => {
    expect(
      noteEventSchema.safeParse({ ...validNote, duration: 0.01 }).success,
    ).toBe(true);
  });
});

describe("midiClipSchema", () => {
  const validMidiClip = {
    id: "mc-1",
    trackId: "track-1",
    type: "midi" as const,
    startTime: 0,
    duration: 4,
    noteEvents: [
      { id: "n1", pitch: 60, velocity: 100, startTime: 0, duration: 0.5 },
    ],
    name: "Melody",
  };

  it("accepts a valid MIDI clip", () => {
    expect(midiClipSchema.safeParse(validMidiClip).success).toBe(true);
  });

  it("accepts a MIDI clip with empty noteEvents", () => {
    expect(
      midiClipSchema.safeParse({ ...validMidiClip, noteEvents: [] }).success,
    ).toBe(true);
  });

  it("rejects type other than midi", () => {
    expect(
      midiClipSchema.safeParse({ ...validMidiClip, type: "audio" }).success,
    ).toBe(false);
  });

  it("rejects invalid note events within the clip", () => {
    expect(
      midiClipSchema.safeParse({
        ...validMidiClip,
        noteEvents: [
          { id: "n1", pitch: 200, velocity: 100, startTime: 0, duration: 0.5 },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects negative startTime", () => {
    expect(
      midiClipSchema.safeParse({ ...validMidiClip, startTime: -1 }).success,
    ).toBe(false);
  });
});

describe("audioClipSchema", () => {
  const validAudioClip = {
    id: "ac-1",
    trackId: "track-1",
    type: "audio" as const,
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 4,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Audio Clip",
  };

  it("accepts a valid audio clip", () => {
    expect(audioClipSchema.safeParse(validAudioClip).success).toBe(true);
  });

  it("rejects type other than audio", () => {
    expect(
      audioClipSchema.safeParse({ ...validAudioClip, type: "midi" }).success,
    ).toBe(false);
  });

  it("rejects gain above 2", () => {
    expect(
      audioClipSchema.safeParse({ ...validAudioClip, gain: 3 }).success,
    ).toBe(false);
  });

  it("rejects negative sourceOffset", () => {
    expect(
      audioClipSchema.safeParse({ ...validAudioClip, sourceOffset: -1 })
        .success,
    ).toBe(false);
  });
});

describe("clipSchema (discriminated union)", () => {
  const validAudioClip = {
    id: "ac-1",
    trackId: "track-1",
    type: "audio" as const,
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 4,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Audio",
  };

  const validMidiClip = {
    id: "mc-1",
    trackId: "track-1",
    type: "midi" as const,
    startTime: 0,
    duration: 4,
    noteEvents: [],
    name: "MIDI",
  };

  it("accepts a valid audio clip", () => {
    expect(clipSchema.safeParse(validAudioClip).success).toBe(true);
  });

  it("accepts a valid MIDI clip", () => {
    expect(clipSchema.safeParse(validMidiClip).success).toBe(true);
  });

  it("rejects unknown type", () => {
    expect(
      clipSchema.safeParse({ ...validAudioClip, type: "unknown" }).success,
    ).toBe(false);
  });

  it("rejects audio clip missing sourceId", () => {
    const noSource = { ...validAudioClip };
    delete (noSource as Record<string, unknown>).sourceId;
    expect(clipSchema.safeParse(noSource).success).toBe(false);
  });

  it("rejects MIDI clip missing noteEvents", () => {
    const noNotes = { ...validMidiClip };
    delete (noNotes as Record<string, unknown>).noteEvents;
    expect(clipSchema.safeParse(noNotes).success).toBe(false);
  });
});
