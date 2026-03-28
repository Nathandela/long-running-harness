/**
 * Synthesizer engine public API.
 * Exports: SynthInstrument, SynthParameterMap, SynthVoiceCommand (epic requirement).
 */

export type { SynthInstrument } from "./synth-instrument";
export { createSynthInstrument } from "./synth-instrument";

export type { SynthParameterMap, SynthVoiceCommand } from "./synth-types";
export {
  DEFAULT_SYNTH_PARAMS,
  midiToFreq,
  WAVEFORM_TYPES,
  FILTER_TYPES,
  LFO_SHAPES,
} from "./synth-types";
