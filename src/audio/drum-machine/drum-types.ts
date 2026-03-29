/**
 * Types and constants for the TR-808 drum machine.
 * Sample-based playback (NOT analog synthesis, per advisory P0-5).
 *
 * Exports: DrumKit, DrumPattern, DrumTrigger (as specified by epic).
 * EARS: R-EVT-12, R-STA-06
 */

import type { MixerEngine } from "@audio/mixer/types";

// ─── Instrument IDs ───

export type DrumInstrumentId =
  | "bd" // bass drum
  | "sd" // snare
  | "lt" // low tom
  | "mt" // mid tom
  | "ht" // high tom
  | "rs" // rimshot
  | "cp" // clap
  | "cb" // cowbell
  | "oh" // open hi-hat
  | "ch" // closed hi-hat
  | "cy"; // cymbal

export type DrumInstrumentInfo = {
  readonly id: DrumInstrumentId;
  readonly label: string;
};

export const DRUM_INSTRUMENTS: readonly DrumInstrumentInfo[] = [
  { id: "bd", label: "Bass Drum" },
  { id: "sd", label: "Snare" },
  { id: "lt", label: "Low Tom" },
  { id: "mt", label: "Mid Tom" },
  { id: "ht", label: "High Tom" },
  { id: "rs", label: "Rimshot" },
  { id: "cp", label: "Clap" },
  { id: "cb", label: "Cowbell" },
  { id: "oh", label: "Open HH" },
  { id: "ch", label: "Closed HH" },
  { id: "cy", label: "Cymbal" },
] as const;

// ─── Per-instrument parameters ───

export type DrumInstrumentParams = {
  /** BiquadFilter cutoff frequency (200..20000 Hz) */
  tone: number;
  /** Amplitude envelope release / decay time (0.01..2 s) */
  decay: number;
  /** AudioBufferSourceNode playbackRate (0.5..2) */
  tune: number;
  /** GainNode gain (0..1) */
  volume: number;
};

export const PARAM_RANGES: Record<
  keyof DrumInstrumentParams,
  { min: number; max: number }
> = {
  tone: { min: 200, max: 20000 },
  decay: { min: 0.01, max: 2 },
  tune: { min: 0.5, max: 2 },
  volume: { min: 0, max: 1 },
};

export const DEFAULT_INSTRUMENT_PARAMS: Record<
  DrumInstrumentId,
  DrumInstrumentParams
> = {
  bd: { tone: 1000, decay: 0.5, tune: 1.0, volume: 0.9 },
  sd: { tone: 5000, decay: 0.3, tune: 1.0, volume: 0.8 },
  lt: { tone: 800, decay: 0.4, tune: 0.8, volume: 0.7 },
  mt: { tone: 1200, decay: 0.35, tune: 1.0, volume: 0.7 },
  ht: { tone: 2000, decay: 0.3, tune: 1.2, volume: 0.7 },
  rs: { tone: 8000, decay: 0.1, tune: 1.0, volume: 0.6 },
  cp: { tone: 3000, decay: 0.4, tune: 1.0, volume: 0.75 },
  cb: { tone: 6000, decay: 0.15, tune: 1.0, volume: 0.6 },
  oh: { tone: 10000, decay: 0.5, tune: 1.0, volume: 0.7 },
  ch: { tone: 10000, decay: 0.08, tune: 1.0, volume: 0.7 },
  cy: { tone: 12000, decay: 1.0, tune: 1.0, volume: 0.5 },
};

// ─── Pattern types ───

/** Per-step trigger map: which instruments fire on this step */
export type DrumStep = {
  readonly triggers: Record<DrumInstrumentId, boolean>;
  readonly accent: boolean;
  /** Flam offset in milliseconds (0 = no flam) */
  readonly flamMs: number;
};

/** A 16-step pattern */
export type DrumPattern = {
  readonly name: string;
  readonly steps: readonly DrumStep[];
};

/** A scheduled drum trigger event */
export type DrumTrigger = {
  readonly instrumentId: DrumInstrumentId;
  readonly time: number;
  readonly velocity: number;
  readonly flamMs?: number;
};

// ─── DrumKit interface ───

export type DrumKit = {
  /** Trigger a drum instrument at the given time */
  trigger(
    instrumentId: DrumInstrumentId,
    time: number,
    velocity: number,
    flamMs?: number,
  ): void;
  /** Set a parameter on an instrument */
  setParam(
    instrumentId: DrumInstrumentId,
    key: keyof DrumInstrumentParams,
    value: number,
  ): void;
  /** Connect output to mixer channel strip */
  connectToMixer(mixer: MixerEngine, trackId: string): void;
  /** Disconnect from mixer */
  disconnectFromMixer(mixer: MixerEngine, trackId: string): void;
  /** Clean up all resources */
  dispose(): void;
};

// ─── GM drum pitch mapping ───

/** Primary MIDI pitch for each drum instrument (GM drum map) */
export const DRUM_TO_PITCH: Readonly<Record<DrumInstrumentId, number>> = {
  bd: 36, // C1 - Bass Drum
  sd: 38, // D1 - Snare
  lt: 41, // F1 - Low Tom
  mt: 45, // A1 - Mid Tom
  ht: 48, // C2 - High Tom
  rs: 37, // C#1 - Rimshot
  cp: 39, // Eb1 - Clap
  cb: 56, // Ab2 - Cowbell
  oh: 46, // Bb1 - Open Hi-Hat
  ch: 42, // F#1 - Closed Hi-Hat
  cy: 49, // Db2 - Cymbal
};

/** MIDI pitch to DrumInstrumentId (GM drum map, multiple pitches per instrument) */
const PITCH_TO_DRUM: Readonly<Record<number, DrumInstrumentId>> = {
  36: "bd",
  35: "bd",
  38: "sd",
  40: "sd",
  41: "lt",
  43: "lt",
  45: "mt",
  47: "mt",
  48: "ht",
  50: "ht",
  37: "rs",
  39: "cp",
  56: "cb",
  46: "oh",
  42: "ch",
  44: "ch",
  49: "cy",
  51: "cy",
};

export function mapPitchToDrum(pitch: number): DrumInstrumentId | undefined {
  return PITCH_TO_DRUM[pitch];
}

// ─── Factory helpers ───

function createEmptyStep(): DrumStep {
  return {
    triggers: {
      bd: false,
      sd: false,
      lt: false,
      mt: false,
      ht: false,
      rs: false,
      cp: false,
      cb: false,
      oh: false,
      ch: false,
      cy: false,
    },
    accent: false,
    flamMs: 0,
  };
}

export function createEmptyPattern(name = "A"): DrumPattern {
  const steps: DrumStep[] = [];
  for (let i = 0; i < 16; i++) {
    steps.push(createEmptyStep());
  }
  return { name, steps };
}
