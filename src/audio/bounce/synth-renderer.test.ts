/**
 * Tests for the offline synth renderer.
 * Renders MIDI note events to stereo Float32Array using synth DSP directly.
 */

import { describe, it, expect } from "vitest";
import { renderMidiClipToAudio } from "./synth-renderer";
import { DEFAULT_SYNTH_PARAMS } from "@audio/synth/synth-types";
import type { MIDINoteEvent } from "@state/track/types";

const SR = 44100;

function makeNote(
  pitch: number,
  velocity: number,
  startTime: number,
  duration: number,
): MIDINoteEvent {
  return {
    id: `note-${String(pitch)}-${String(startTime)}`,
    pitch,
    velocity,
    startTime,
    duration,
  };
}

describe("renderMidiClipToAudio", () => {
  it("returns stereo output with correct length", () => {
    const notes: MIDINoteEvent[] = [makeNote(60, 100, 0, 0.5)];
    const result = renderMidiClipToAudio(notes, 1.0, SR, DEFAULT_SYNTH_PARAMS);

    expect(result.left.length).toBe(SR); // 1 second
    expect(result.right.length).toBe(SR);
  });

  it("produces non-silent output for a note", () => {
    const notes: MIDINoteEvent[] = [makeNote(69, 100, 0, 0.5)]; // A4
    const result = renderMidiClipToAudio(notes, 1.0, SR, DEFAULT_SYNTH_PARAMS);

    // Should have audio signal (not all zeros)
    const maxAbs = result.left.reduce(
      (max, s) => Math.max(max, Math.abs(s)),
      0,
    );
    expect(maxAbs).toBeGreaterThan(0.01);
  });

  it("produces silence when no notes", () => {
    const result = renderMidiClipToAudio([], 1.0, SR, DEFAULT_SYNTH_PARAMS);

    const maxAbs = result.left.reduce(
      (max, s) => Math.max(max, Math.abs(s)),
      0,
    );
    expect(maxAbs).toBe(0);
  });

  it("handles multiple overlapping notes (polyphony)", () => {
    const notes: MIDINoteEvent[] = [
      makeNote(60, 100, 0, 0.5), // C4
      makeNote(64, 100, 0, 0.5), // E4
      makeNote(67, 100, 0, 0.5), // G4
    ];
    const result = renderMidiClipToAudio(notes, 1.0, SR, DEFAULT_SYNTH_PARAMS);

    // Should be louder than a single note
    const maxAbs = result.left.reduce(
      (max, s) => Math.max(max, Math.abs(s)),
      0,
    );
    expect(maxAbs).toBeGreaterThan(0.05);
  });

  it("respects note timing - note at 0.5s is silent before that", () => {
    const notes: MIDINoteEvent[] = [makeNote(69, 100, 0.5, 0.3)];
    const result = renderMidiClipToAudio(notes, 1.0, SR, DEFAULT_SYNTH_PARAMS);

    // First 0.4 seconds should be silence (with some margin for attack)
    const samplesBeforeNote = Math.floor(0.4 * SR);
    const firstPart = result.left.subarray(0, samplesBeforeNote);
    const maxAbsBefore = firstPart.reduce(
      (max, s) => Math.max(max, Math.abs(s)),
      0,
    );
    expect(maxAbsBefore).toBe(0);
  });

  it("applies velocity scaling", () => {
    const loudNote: MIDINoteEvent[] = [makeNote(69, 127, 0, 0.5)];
    const quietNote: MIDINoteEvent[] = [makeNote(69, 32, 0, 0.5)];

    const loudResult = renderMidiClipToAudio(
      loudNote,
      1.0,
      SR,
      DEFAULT_SYNTH_PARAMS,
    );
    const quietResult = renderMidiClipToAudio(
      quietNote,
      1.0,
      SR,
      DEFAULT_SYNTH_PARAMS,
    );

    const loudMax = loudResult.left.reduce(
      (max, s) => Math.max(max, Math.abs(s)),
      0,
    );
    const quietMax = quietResult.left.reduce(
      (max, s) => Math.max(max, Math.abs(s)),
      0,
    );

    expect(loudMax).toBeGreaterThan(quietMax);
  });

  it("produces finite values (no NaN or Infinity)", () => {
    const notes: MIDINoteEvent[] = [
      makeNote(127, 127, 0, 0.5), // Very high note
      makeNote(21, 127, 0, 0.5), // Very low note
    ];
    const result = renderMidiClipToAudio(notes, 1.0, SR, DEFAULT_SYNTH_PARAMS);

    const hasNaN = result.left.some((s) => !isFinite(s));
    expect(hasNaN).toBe(false);
  });

  it("applies note-off release envelope", () => {
    // Short note with release - should have audio after note-off
    const params = { ...DEFAULT_SYNTH_PARAMS, ampRelease: 0.5 };
    const notes: MIDINoteEvent[] = [makeNote(69, 100, 0, 0.1)];
    const result = renderMidiClipToAudio(notes, 1.0, SR, params);

    // At 0.2s (after 0.1s note + some release), there should still be signal
    const sampleAt200ms = Math.floor(0.2 * SR);
    const levelAt200ms = Math.abs(result.left[sampleAt200ms] ?? 0);
    expect(levelAt200ms).toBeGreaterThan(0);
  });
});
