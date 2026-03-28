/**
 * Live MIDI recording -- captures validated MIDI messages into MIDINoteEvents.
 * Uses an open-note map to pair note-on/note-off events.
 */

import type { MIDINoteEvent } from "@state/track/types";
import type { ValidatedMidiMessage } from "./midi-input-validator";

export type MidiRecorderState = "idle" | "armed" | "recording";

export type MidiRecorder = {
  readonly state: MidiRecorderState;
  arm(): void;
  startRecording(transportTimeSeconds: number): void;
  recordMessage(
    message: ValidatedMidiMessage,
    transportTimeSeconds: number,
  ): void;
  stopRecording(): readonly MIDINoteEvent[];
  disarm(): void;
};

type OpenNote = {
  readonly id: string;
  readonly pitch: number;
  readonly velocity: number;
  readonly startTime: number; // relative to recording start
  readonly startAbsolute: number; // absolute transport time
};

let nextNoteId = 0;
function generateNoteId(): string {
  return `rec-${String(Date.now())}-${String(nextNoteId++)}`;
}

export function createMidiRecorder(): MidiRecorder {
  let currentState: MidiRecorderState = "idle";
  let recordingStartTime = 0;
  let lastMessageTime = 0;
  const openNotes = new Map<number, OpenNote>(); // keyed by channel * 128 + note
  const completedNotes: MIDINoteEvent[] = [];

  function reset(): void {
    openNotes.clear();
    completedNotes.length = 0;
    recordingStartTime = 0;
    lastMessageTime = 0;
  }

  return {
    get state(): MidiRecorderState {
      return currentState;
    },

    arm(): void {
      currentState = "armed";
    },

    startRecording(transportTimeSeconds: number): void {
      if (currentState !== "armed") return;
      reset();
      currentState = "recording";
      recordingStartTime = transportTimeSeconds;
      lastMessageTime = transportTimeSeconds;
    },

    recordMessage(
      message: ValidatedMidiMessage,
      transportTimeSeconds: number,
    ): void {
      if (currentState !== "recording") return;
      lastMessageTime = transportTimeSeconds;

      if (message.type === "note-on") {
        const key = message.channel * 128 + message.note;
        openNotes.set(key, {
          id: generateNoteId(),
          pitch: message.note,
          velocity: message.velocity,
          startTime: transportTimeSeconds - recordingStartTime,
          startAbsolute: transportTimeSeconds,
        });
      } else if (message.type === "note-off") {
        const key = message.channel * 128 + message.note;
        const open = openNotes.get(key);
        if (open) {
          completedNotes.push({
            id: open.id,
            pitch: open.pitch,
            velocity: open.velocity,
            startTime: open.startTime,
            duration: Math.max(0.01, transportTimeSeconds - open.startAbsolute),
          });
          openNotes.delete(key);
        }
      }
      // CC and pitch-bend are ignored for note recording
    },

    stopRecording(): readonly MIDINoteEvent[] {
      if (currentState !== "recording") return [];

      // Close any open notes at the last known message time
      for (const open of openNotes.values()) {
        completedNotes.push({
          id: open.id,
          pitch: open.pitch,
          velocity: open.velocity,
          startTime: open.startTime,
          duration: Math.max(0.01, lastMessageTime - open.startAbsolute),
        });
      }
      openNotes.clear();

      const result = [...completedNotes];
      completedNotes.length = 0;
      currentState = "idle";
      return result;
    },

    disarm(): void {
      currentState = "idle";
      reset();
    },
  };
}
