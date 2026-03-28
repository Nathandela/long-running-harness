/**
 * Shared types for the synthesizer engine.
 * Used by both the AudioWorklet processor and main thread.
 *
 * Exports: SynthParameterMap, SynthVoiceCommand (as specified by epic).
 */

import type { WaveformType } from "./dsp/polyblep";
import type { FilterType } from "./dsp/biquad-coeffs";
import type { LFOShape } from "./dsp/lfo";

// ─── Voice Commands (main thread → worklet) ───

export type SynthVoiceCommand =
  | { type: "noteOn"; note: number; velocity: number; legato: boolean }
  | { type: "noteOff"; note: number }
  | { type: "allNotesOff" }
  | { type: "setParam"; key: string; value: number }
  | {
      type: "setModRoutes";
      routes: {
        sourceIdx: number;
        destIdx: number;
        amount: number;
        bipolar: boolean;
      }[];
    }
  | { type: "setModSource"; source: string; value: number };

// ─── Parameter Map ───

export type SynthParameterMap = {
  // Oscillator 1
  osc1Type: WaveformType;
  osc1Octave: number; // -2..+2
  osc1Detune: number; // cents, -100..+100
  osc1Level: number; // 0..1

  // Oscillator 2
  osc2Type: WaveformType;
  osc2Octave: number;
  osc2Detune: number;
  osc2Level: number;

  // Filter
  filterType: FilterType;
  filterCutoff: number; // Hz, 20..20000
  filterResonance: number; // Q, 0.5..20

  // Amplitude Envelope
  ampAttack: number; // seconds
  ampDecay: number;
  ampSustain: number; // 0..1
  ampRelease: number;

  // Filter Envelope
  filterAttack: number;
  filterDecay: number;
  filterSustain: number; // 0..1
  filterRelease: number;
  filterEnvDepth: number; // semitones, -60..+60

  // LFO 1
  lfo1Rate: number; // Hz, 0.1..20
  lfo1Depth: number; // 0..1
  lfo1Shape: LFOShape;

  // LFO 2
  lfo2Rate: number; // Hz, 0.1..20
  lfo2Depth: number; // 0..1
  lfo2Shape: LFOShape;

  // Glide
  glideTime: number; // seconds, 0..1

  // Master
  masterGain: number; // 0..1
};

/** Default parameter values */
export const DEFAULT_SYNTH_PARAMS: SynthParameterMap = {
  osc1Type: "saw",
  osc1Octave: 0,
  osc1Detune: 0,
  osc1Level: 0.8,

  osc2Type: "saw",
  osc2Octave: 0,
  osc2Detune: 7, // Slight detune for thickness
  osc2Level: 0.5,

  filterType: "lowpass",
  filterCutoff: 5000,
  filterResonance: 1,

  ampAttack: 0.01,
  ampDecay: 0.2,
  ampSustain: 0.7,
  ampRelease: 0.3,

  filterAttack: 0.01,
  filterDecay: 0.3,
  filterSustain: 0.3,
  filterRelease: 0.5,
  filterEnvDepth: 24,

  lfo1Rate: 5,
  lfo1Depth: 0,
  lfo1Shape: "sine",

  lfo2Rate: 3,
  lfo2Depth: 0,
  lfo2Shape: "sine",

  glideTime: 0,

  masterGain: 0.7,
};

// ─── MIDI → Frequency Conversion ───

/** Convert MIDI note number to frequency in Hz. A4 = 69 = 440Hz. */
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** Waveform type index mapping for AudioParam/message passing */
export const WAVEFORM_TYPES: readonly WaveformType[] = [
  "sine",
  "saw",
  "square",
  "triangle",
];

/** Filter type index mapping */
export const FILTER_TYPES: readonly FilterType[] = [
  "lowpass",
  "highpass",
  "bandpass",
];

/** LFO shape index mapping */
export const LFO_SHAPES: readonly LFOShape[] = [
  "sine",
  "square",
  "triangle",
  "sample-and-hold",
];
