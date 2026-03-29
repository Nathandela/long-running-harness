/**
 * Offline synth renderer: renders MIDI note events to stereo audio
 * using the synth DSP functions directly (no AudioWorklet dependency).
 *
 * This mirrors the SynthProcessor logic but runs synchronously,
 * producing Float32Arrays suitable for use as AudioBufferSourceNodes
 * in the offline bounce context.
 */

import type { MIDINoteEvent } from "@state/track/types";
import type { SynthParameterMap } from "@audio/synth/synth-types";
import { midiToFreq } from "@audio/synth/synth-types";
import { createPolyBLEPOsc } from "@audio/synth/dsp/polyblep";
import { createADSREnvelope, type ADSRParams } from "@audio/synth/dsp/adsr";
import {
  computeBiquadCoeffs,
  createBiquadFilter,
} from "@audio/synth/dsp/biquad-coeffs";
import { createLFO } from "@audio/synth/dsp/lfo";
import {
  createModAccumulators,
  resetAccumulators,
  applyModRoute,
  SOURCE_INDEX,
  type WorkletModRoute,
  type ModAccumulators,
} from "@audio/synth/modulation-engine";

const MAX_VOICES = 16;

type OfflineVoice = {
  active: boolean;
  releasing: boolean;
  note: number;
  osc1: ReturnType<typeof createPolyBLEPOsc>;
  osc2: ReturnType<typeof createPolyBLEPOsc>;
  ampEnv: ReturnType<typeof createADSREnvelope>;
  filterEnv: ReturnType<typeof createADSREnvelope>;
  filter: ReturnType<typeof createBiquadFilter>;
  targetFreq: number;
  currentFreq: number;
  velocity: number;
};

function createOfflineVoice(): OfflineVoice {
  return {
    active: false,
    releasing: false,
    note: -1,
    osc1: createPolyBLEPOsc("saw"),
    osc2: createPolyBLEPOsc("saw"),
    ampEnv: createADSREnvelope(),
    filterEnv: createADSREnvelope(),
    filter: createBiquadFilter("lowpass"),
    targetFreq: 440,
    currentFreq: 440,
    velocity: 0,
  };
}

type NoteEvent = {
  sample: number;
  type: "on" | "off";
  note: number;
  velocity: number;
};

export type RenderedAudio = {
  readonly left: Float32Array;
  readonly right: Float32Array;
};

/**
 * Render MIDI note events to stereo audio using synth DSP.
 * @param notes - MIDI note events (startTime relative to clip start)
 * @param duration - Total duration to render in seconds
 * @param sampleRate - Sample rate
 * @param params - Synth parameter snapshot
 * @param modRoutes - Optional modulation routes (mirrors SynthProcessor mod matrix)
 */
export function renderMidiClipToAudio(
  notes: readonly MIDINoteEvent[],
  duration: number,
  sampleRate: number,
  params: SynthParameterMap,
  modRoutes: readonly WorkletModRoute[] = [],
): RenderedAudio {
  const totalSamples = Math.ceil(duration * sampleRate);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  if (notes.length === 0) return { left, right };

  // Build sorted event list (note-ons and note-offs)
  const events: NoteEvent[] = [];
  for (const note of notes) {
    const onSample = Math.floor(note.startTime * sampleRate);
    const offSample = Math.floor((note.startTime + note.duration) * sampleRate);
    events.push({
      sample: onSample,
      type: "on",
      note: note.pitch,
      velocity: note.velocity,
    });
    events.push({
      sample: offSample,
      type: "off",
      note: note.pitch,
      velocity: 0,
    });
  }
  events.sort((a, b) => a.sample - b.sample || (a.type === "off" ? -1 : 1));

  // Pre-allocate voices
  const voices: OfflineVoice[] = Array.from({ length: MAX_VOICES }, () =>
    createOfflineVoice(),
  );

  // LFOs for modulation (mirrors SynthProcessor)
  const lfo1 = createLFO(params.lfo1Shape);
  const lfo2 = createLFO(params.lfo2Shape);
  const modSourceValues = new Float64Array(8);
  const modAccGlobal: ModAccumulators = createModAccumulators();
  const modAccVoice: ModAccumulators = createModAccumulators();
  const voiceSrcValues = new Float64Array(8);

  // ADSR params (pre-allocated)
  const ampParams: ADSRParams = {
    attack: params.ampAttack,
    decay: params.ampDecay,
    sustain: params.ampSustain,
    release: params.ampRelease,
  };
  const filterParams: ADSRParams = {
    attack: params.filterAttack,
    decay: params.filterDecay,
    sustain: params.filterSustain,
    release: params.filterRelease,
  };

  // Pre-compute constants
  const osc1OctMul = Math.pow(2, params.osc1Octave);
  const osc1DetMul = Math.pow(2, params.osc1Detune / 1200);
  const osc2OctMul = Math.pow(2, params.osc2Octave);
  const osc2DetMul = Math.pow(2, params.osc2Detune / 1200);

  let eventIdx = 0;

  for (let s = 0; s < totalSamples; s++) {
    // Process events at this sample
    while (eventIdx < events.length) {
      const evt = events[eventIdx];
      if (!evt || evt.sample > s) break;

      if (evt.type === "on") {
        allocateNoteOn(voices, evt.note, evt.velocity, params, sampleRate);
      } else {
        releaseNote(voices, evt.note);
      }
      eventIdx++;
    }

    // LFO processing (global, before voice loop — mirrors SynthProcessor)
    const lfo1Rate = Math.max(0.01, params.lfo1Rate + modAccGlobal.lfo1Rate);
    const lfo2Rate = Math.max(0.01, params.lfo2Rate + modAccGlobal.lfo2Rate);
    const lfo1Val = lfo1.process(lfo1Rate, sampleRate);
    const lfo2Val = lfo2.process(lfo2Rate, sampleRate);

    modSourceValues[SOURCE_INDEX.lfo1] = lfo1Val * params.lfo1Depth;
    modSourceValues[SOURCE_INDEX.lfo2] = lfo2Val * params.lfo2Depth;

    // Compute global modulation accumulation
    resetAccumulators(modAccGlobal);
    for (const route of modRoutes) {
      const si = route.sourceIdx;
      if (
        si === SOURCE_INDEX.lfo1 ||
        si === SOURCE_INDEX.lfo2 ||
        si === SOURCE_INDEX.aftertouch ||
        si === SOURCE_INDEX.modWheel ||
        si === SOURCE_INDEX.pitchBend
      ) {
        applyModRoute(
          modAccGlobal,
          modSourceValues,
          si,
          route.destIdx,
          route.amount,
          route.bipolar,
        );
      }
    }

    let mixL = 0;
    let mixR = 0;

    for (let vi = 0; vi < MAX_VOICES; vi++) {
      const v = voices[vi];
      if (!v || !v.active) continue;

      // Check if release finished
      if (v.ampEnv.stage === "idle" && v.releasing) {
        v.active = false;
        v.releasing = false;
        continue;
      }

      // Pitch glide
      if (params.glideTime > 0 && v.currentFreq !== v.targetFreq) {
        const glideCoeff = 1 - Math.exp(-1 / (params.glideTime * sampleRate));
        v.currentFreq += glideCoeff * (v.targetFreq - v.currentFreq);
      } else {
        v.currentFreq = v.targetFreq;
      }

      const baseFreq = v.currentFreq;

      // Envelopes
      const filterEnvVal = v.filterEnv.process(filterParams, sampleRate);
      const ampLevel = v.ampEnv.process(ampParams, sampleRate);

      // Per-voice modulation
      resetAccumulators(modAccVoice);
      if (modRoutes.length > 0) {
        voiceSrcValues[SOURCE_INDEX.ampEnv] = ampLevel;
        voiceSrcValues[SOURCE_INDEX.filterEnv] = filterEnvVal;
        voiceSrcValues[SOURCE_INDEX.velocity] = v.velocity;

        for (const route of modRoutes) {
          const si = route.sourceIdx;
          if (
            si === SOURCE_INDEX.ampEnv ||
            si === SOURCE_INDEX.filterEnv ||
            si === SOURCE_INDEX.velocity
          ) {
            applyModRoute(
              modAccVoice,
              voiceSrcValues,
              si,
              route.destIdx,
              route.amount,
              route.bipolar,
            );
          }
        }
      }

      // Combined modulation (global + per-voice)
      const modPitchOsc1 = modAccGlobal.osc1Pitch + modAccVoice.osc1Pitch;
      const modPitchOsc2 = modAccGlobal.osc2Pitch + modAccVoice.osc2Pitch;
      const modFilterCutoff =
        modAccGlobal.filterCutoff + modAccVoice.filterCutoff;
      const modFilterReso =
        modAccGlobal.filterResonance + modAccVoice.filterResonance;
      const modAmpLevel = modAccGlobal.ampLevel + modAccVoice.ampLevel;
      const modOscMix = modAccGlobal.oscMix + modAccVoice.oscMix;

      // Pitch modulation (scaled to semitones, max +/-24)
      const pitchMult1 = Math.pow(2, (modPitchOsc1 * 24) / 12);
      const pitchMult2 = Math.pow(2, (modPitchOsc2 * 24) / 12);

      // Oscillators
      const freq1 = baseFreq * osc1OctMul * osc1DetMul * pitchMult1;
      const freq2 = baseFreq * osc2OctMul * osc2DetMul * pitchMult2;
      const osc1Out = v.osc1.next(freq1, sampleRate) * params.osc1Level;
      const osc2Out = v.osc2.next(freq2, sampleRate) * params.osc2Level;

      // Osc mix modulation
      const osc1Gain = Math.max(0, Math.min(1, 1 - modOscMix));
      const osc2Gain = Math.max(0, Math.min(1, 1 + modOscMix));
      let sample = osc1Out * osc1Gain + osc2Out * osc2Gain;

      // Filter (recompute coefficients periodically for efficiency)
      if (s % 128 === 0) {
        const cutoffModSt =
          filterEnvVal * params.filterEnvDepth + modFilterCutoff * 60;
        const modulatedCutoff =
          params.filterCutoff * Math.pow(2, cutoffModSt / 12);
        const clampedCutoff = Math.min(
          Math.max(modulatedCutoff, 20),
          sampleRate / 2 - 100,
        );
        const modulatedReso = Math.max(
          0.5,
          Math.min(20, params.filterResonance + modFilterReso * 10),
        );
        computeBiquadCoeffs(
          params.filterType,
          clampedCutoff,
          modulatedReso,
          sampleRate,
          v.filter.coeffs,
        );
      }

      sample = v.filter.process(sample);

      // Amplitude modulation: base envelope * (1 + mod offset)
      const ampMod = Math.max(0, 1 + modAmpLevel);

      // Velocity -> amplitude
      const velAmp = 0.5 + v.velocity * 0.5;
      sample *= ampLevel * ampMod * velAmp * params.masterGain;

      // Clamp to prevent overflow
      if (!isFinite(sample)) sample = 0;

      mixL += sample;
      mixR += sample;
    }

    left[s] = mixL;
    right[s] = mixR;
  }

  return { left, right };
}

/** Allocate a voice for a new note (oldest-steal if full) */
function allocateNoteOn(
  voices: OfflineVoice[],
  note: number,
  velocity: number,
  params: SynthParameterMap,
  sampleRate: number,
): void {
  // Find free voice
  let idx = -1;
  for (let i = 0; i < MAX_VOICES; i++) {
    if (voices[i]?.active !== true) {
      idx = i;
      break;
    }
  }

  // Steal oldest releasing voice if no free voice
  if (idx === -1) {
    for (let i = 0; i < MAX_VOICES; i++) {
      if (voices[i]?.releasing === true) {
        idx = i;
        break;
      }
    }
  }

  // Steal first voice as last resort
  if (idx === -1) idx = 0;

  const v = voices[idx];
  if (!v) return;

  const freq = midiToFreq(note);
  v.active = true;
  v.releasing = false;
  v.note = note;
  v.velocity = velocity / 127;
  v.targetFreq = freq;
  v.currentFreq = freq;

  v.osc1.reset();
  v.osc2.reset();
  v.filter.reset();
  v.osc1.type = params.osc1Type;
  v.osc2.type = params.osc2Type;
  v.filter.type = params.filterType;

  // Compute initial biquad coefficients so the filter doesn't produce silence
  // until the next s % 128 boundary in the render loop.
  computeBiquadCoeffs(
    params.filterType,
    Math.min(Math.max(params.filterCutoff, 20), sampleRate / 2 - 100),
    params.filterResonance,
    sampleRate,
    v.filter.coeffs,
  );

  v.ampEnv.gate(false);
  v.filterEnv.gate(false);
}

/** Release all voices playing this note */
function releaseNote(voices: OfflineVoice[], note: number): void {
  for (let i = 0; i < MAX_VOICES; i++) {
    const v = voices[i];
    if (v && v.active && !v.releasing && v.note === note) {
      v.releasing = true;
      v.ampEnv.release();
      v.filterEnv.release();
    }
  }
}
