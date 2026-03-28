import { describe, it, expect } from "vitest";
import type {
  MIDINoteEvent,
  MidiClipModel,
  AudioClipModel,
  ClipModel,
} from "./types";
import { isAudioClip, isMidiClip } from "./types";

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

function makeAudioClip(
  overrides: Partial<AudioClipModel> = {},
): AudioClipModel {
  return {
    id: "clip-1",
    trackId: "track-1",
    type: "audio",
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 4,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Audio Clip",
    ...overrides,
  };
}

function makeMidiClip(overrides: Partial<MidiClipModel> = {}): MidiClipModel {
  return {
    id: "clip-2",
    trackId: "track-1",
    type: "midi",
    startTime: 0,
    duration: 4,
    noteEvents: [],
    name: "MIDI Clip",
    ...overrides,
  };
}

describe("MIDINoteEvent type", () => {
  it("holds pitch, velocity, startTime, and duration", () => {
    const note = makeNoteEvent({
      pitch: 64,
      velocity: 80,
      startTime: 1.0,
      duration: 0.25,
    });
    expect(note.id).toBe("note-1");
    expect(note.pitch).toBe(64);
    expect(note.velocity).toBe(80);
    expect(note.startTime).toBe(1.0);
    expect(note.duration).toBe(0.25);
  });

  it("allows boundary pitch values (0 and 127)", () => {
    const low = makeNoteEvent({ pitch: 0 });
    const high = makeNoteEvent({ pitch: 127 });
    expect(low.pitch).toBe(0);
    expect(high.pitch).toBe(127);
  });

  it("allows boundary velocity values (0 and 127)", () => {
    const silent = makeNoteEvent({ velocity: 0 });
    const max = makeNoteEvent({ velocity: 127 });
    expect(silent.velocity).toBe(0);
    expect(max.velocity).toBe(127);
  });
});

describe("MidiClipModel type", () => {
  it("has type discriminator set to midi", () => {
    const clip = makeMidiClip();
    expect(clip.type).toBe("midi");
  });

  it("contains an array of note events", () => {
    const notes = [
      makeNoteEvent({ id: "n1", pitch: 60, startTime: 0 }),
      makeNoteEvent({ id: "n2", pitch: 64, startTime: 0.5 }),
    ];
    const clip = makeMidiClip({ noteEvents: notes });
    expect(clip.noteEvents).toHaveLength(2);
    expect(clip.noteEvents[0]?.pitch).toBe(60);
    expect(clip.noteEvents[1]?.pitch).toBe(64);
  });

  it("has id, trackId, startTime, duration, and name", () => {
    const clip = makeMidiClip({
      id: "mc-1",
      trackId: "t2",
      startTime: 4,
      duration: 8,
      name: "Melody",
    });
    expect(clip.id).toBe("mc-1");
    expect(clip.trackId).toBe("t2");
    expect(clip.startTime).toBe(4);
    expect(clip.duration).toBe(8);
    expect(clip.name).toBe("Melody");
  });
});

describe("AudioClipModel type", () => {
  it("has type discriminator set to audio", () => {
    const clip = makeAudioClip();
    expect(clip.type).toBe("audio");
  });

  it("retains all original ClipModel audio fields", () => {
    const clip = makeAudioClip({
      sourceId: "src-2",
      sourceOffset: 1.5,
      gain: 0.8,
      fadeIn: 0.1,
      fadeOut: 0.2,
    });
    expect(clip.sourceId).toBe("src-2");
    expect(clip.sourceOffset).toBe(1.5);
    expect(clip.gain).toBe(0.8);
    expect(clip.fadeIn).toBe(0.1);
    expect(clip.fadeOut).toBe(0.2);
  });
});

describe("ClipModel discriminated union", () => {
  it("can hold an AudioClipModel", () => {
    const clip: ClipModel = makeAudioClip();
    expect(clip.type).toBe("audio");
  });

  it("can hold a MidiClipModel", () => {
    const clip: ClipModel = makeMidiClip();
    expect(clip.type).toBe("midi");
  });
});

describe("isAudioClip", () => {
  it("returns true for audio clips", () => {
    expect(isAudioClip(makeAudioClip())).toBe(true);
  });

  it("returns false for midi clips", () => {
    expect(isAudioClip(makeMidiClip())).toBe(false);
  });
});

describe("isMidiClip", () => {
  it("returns true for midi clips", () => {
    expect(isMidiClip(makeMidiClip())).toBe(true);
  });

  it("returns false for audio clips", () => {
    expect(isMidiClip(makeAudioClip())).toBe(false);
  });
});
