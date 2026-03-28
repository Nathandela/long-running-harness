import { describe, it, expect, beforeEach } from "vitest";
import { createMidiRecorder } from "./midi-recorder";
import type { MidiRecorder } from "./midi-recorder";
import type { ValidatedMidiMessage } from "./midi-input-validator";

describe("createMidiRecorder", () => {
  let recorder: MidiRecorder;

  beforeEach(() => {
    recorder = createMidiRecorder();
  });

  it("starts in idle state", () => {
    expect(recorder.state).toBe("idle");
  });

  it("arm changes state to armed", () => {
    recorder.arm();
    expect(recorder.state).toBe("armed");
  });

  it("startRecording changes state to recording", () => {
    recorder.arm();
    recorder.startRecording(0);
    expect(recorder.state).toBe("recording");
  });

  it("startRecording does nothing if not armed", () => {
    recorder.startRecording(0);
    expect(recorder.state).toBe("idle");
  });

  it("recordMessage captures note-on and note-off pair as MIDINoteEvent", () => {
    recorder.arm();
    recorder.startRecording(0);

    const noteOn: ValidatedMidiMessage = {
      type: "note-on",
      note: 60,
      velocity: 100,
      channel: 0,
    };
    const noteOff: ValidatedMidiMessage = {
      type: "note-off",
      note: 60,
      channel: 0,
    };

    recorder.recordMessage(noteOn, 1.0);
    recorder.recordMessage(noteOff, 2.0);

    const notes = recorder.stopRecording();
    expect(notes).toHaveLength(1);
    expect(notes[0]?.pitch).toBe(60);
    expect(notes[0]?.velocity).toBe(100);
    expect(notes[0]?.startTime).toBe(1.0);
    expect(notes[0]?.duration).toBe(1.0);
  });

  it("recordMessage computes correct duration from note-on to note-off", () => {
    recorder.arm();
    recorder.startRecording(10.0);

    const noteOn: ValidatedMidiMessage = {
      type: "note-on",
      note: 72,
      velocity: 80,
      channel: 0,
    };
    const noteOff: ValidatedMidiMessage = {
      type: "note-off",
      note: 72,
      channel: 0,
    };

    recorder.recordMessage(noteOn, 12.5);
    recorder.recordMessage(noteOff, 14.0);

    const notes = recorder.stopRecording();
    expect(notes).toHaveLength(1);
    expect(notes[0]?.startTime).toBeCloseTo(2.5, 6); // 12.5 - 10.0
    expect(notes[0]?.duration).toBeCloseTo(1.5, 6); // 14.0 - 12.5
  });

  it("recordMessage handles multiple simultaneous notes", () => {
    recorder.arm();
    recorder.startRecording(0);

    // Two notes overlapping
    recorder.recordMessage(
      { type: "note-on", note: 60, velocity: 100, channel: 0 },
      0.0,
    );
    recorder.recordMessage(
      { type: "note-on", note: 64, velocity: 90, channel: 0 },
      0.5,
    );
    recorder.recordMessage({ type: "note-off", note: 60, channel: 0 }, 1.0);
    recorder.recordMessage({ type: "note-off", note: 64, channel: 0 }, 1.5);

    const notes = recorder.stopRecording();
    expect(notes).toHaveLength(2);

    const note60 = notes.find((n) => n.pitch === 60);
    const note64 = notes.find((n) => n.pitch === 64);
    expect(note60).toBeDefined();
    expect(note64).toBeDefined();
    expect(note60?.duration).toBeCloseTo(1.0, 6);
    expect(note64?.duration).toBeCloseTo(1.0, 6);
  });

  it("stopRecording closes all open notes at stop time", () => {
    recorder.arm();
    recorder.startRecording(0);

    recorder.recordMessage(
      { type: "note-on", note: 60, velocity: 100, channel: 0 },
      1.0,
    );
    // No note-off -- stop at 3.0 should close it

    const notes = recorder.stopRecording();
    expect(notes).toHaveLength(1);
    // The open note started at transport 1.0, stop at the moment stopRecording is called
    // Duration is from 1.0 to whatever the last known time is
    expect(notes[0]?.pitch).toBe(60);
    expect(notes[0]?.startTime).toBe(1.0);
  });

  it("stopRecording returns all captured notes and resets state", () => {
    recorder.arm();
    recorder.startRecording(0);

    recorder.recordMessage(
      { type: "note-on", note: 60, velocity: 100, channel: 0 },
      0.0,
    );
    recorder.recordMessage({ type: "note-off", note: 60, channel: 0 }, 1.0);

    const notes = recorder.stopRecording();
    expect(notes).toHaveLength(1);
    expect(recorder.state).toBe("idle");

    // Second stop should return empty
    const notes2 = recorder.stopRecording();
    expect(notes2).toHaveLength(0);
  });

  it("disarm resets to idle", () => {
    recorder.arm();
    expect(recorder.state).toBe("armed");
    recorder.disarm();
    expect(recorder.state).toBe("idle");
  });

  it("ignores non-note messages during recording", () => {
    recorder.arm();
    recorder.startRecording(0);

    const cc: ValidatedMidiMessage = {
      type: "cc",
      controller: 1,
      value: 64,
      channel: 0,
    };
    recorder.recordMessage(cc, 0.5);

    const notes = recorder.stopRecording();
    expect(notes).toHaveLength(0);
  });

  it("ignores messages when not recording", () => {
    recorder.recordMessage(
      { type: "note-on", note: 60, velocity: 100, channel: 0 },
      0.0,
    );
    recorder.recordMessage({ type: "note-off", note: 60, channel: 0 }, 1.0);
    // Not recording, so nothing captured; calling stop should be safe
    const notes = recorder.stopRecording();
    expect(notes).toHaveLength(0);
  });
});
