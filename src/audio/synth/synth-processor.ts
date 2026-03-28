/**
 * Synthesizer AudioWorklet processor.
 * Runs on the audio rendering thread — zero allocations in process().
 *
 * Architecture: 16 fixed voices, each with:
 * - 2 PolyBLEP oscillators
 * - Biquad filter (LP/HP/BP)
 * - ADSR amplitude envelope
 * - ADSR filter envelope
 * Shared: 2 LFOs, hardwired modulation matrix.
 *
 * INV-3/NFR-14: Zero-allocation process().
 * MIT-H4-5: Oldest-steal with 5ms crossfade.
 * MIT-H4-6: 2ms minimum release time.
 * R-STA-05: Legato mode with pitch glide.
 */

import { createPolyBLEPOsc, type PolyBLEPOsc } from "./dsp/polyblep";
import {
  createADSREnvelope,
  type ADSREnvelope,
  type ADSRParams,
} from "./dsp/adsr";
import {
  computeBiquadCoeffs,
  createBiquadFilter,
  type BiquadFilter,
} from "./dsp/biquad-coeffs";
import { createLFO, type LFO } from "./dsp/lfo";
import {
  createVoiceAllocator,
  type VoiceAllocator,
  MAX_VOICES,
} from "./dsp/voice-allocator";
import {
  midiToFreq,
  WAVEFORM_TYPES,
  FILTER_TYPES,
  LFO_SHAPES,
  type SynthVoiceCommand,
  type SynthParameterMap,
  DEFAULT_SYNTH_PARAMS,
} from "./synth-types";

// ─── AudioWorklet globals ───
declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}
declare function registerProcessor(
  name: string,
  ctor: typeof AudioWorkletProcessor,
): void;

// ─── Per-Voice State (pre-allocated) ───

type VoiceData = {
  osc1: PolyBLEPOsc;
  osc2: PolyBLEPOsc;
  ampEnv: ADSREnvelope;
  filterEnv: ADSREnvelope;
  filter: BiquadFilter;
  targetFreq: number;
  currentFreq: number;
  velocity: number;
};

function createVoiceData(): VoiceData {
  return {
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

/** Safe access to pre-allocated arrays */
function at<T>(arr: T[], i: number): T {
  const val = arr[i];
  if (val === undefined) throw new Error("Index out of bounds");
  return val;
}

class SynthProcessor extends AudioWorkletProcessor {
  private allocator: VoiceAllocator;
  private voiceData: VoiceData[];
  private lfo1: LFO;
  private lfo2: LFO;
  private params: SynthParameterMap;
  // Pre-allocated ADSR params (S2-3: avoid per-quantum allocation)
  private ampParams: ADSRParams;
  private filterParams: ADSRParams;
  private alive = true;

  constructor() {
    super();

    this.allocator = createVoiceAllocator();
    this.voiceData = Array.from({ length: MAX_VOICES }, () =>
      createVoiceData(),
    );
    this.lfo1 = createLFO("sine");
    this.lfo2 = createLFO("sine");
    this.params = { ...DEFAULT_SYNTH_PARAMS };
    this.ampParams = { attack: 0, decay: 0, sustain: 0, release: 0 };
    this.filterParams = { attack: 0, decay: 0, sustain: 0, release: 0 };

    this.port.onmessage = (e: MessageEvent) => {
      this.handleMessage(e.data as SynthVoiceCommand);
    };
  }

  private handleMessage(cmd: SynthVoiceCommand): void {
    switch (cmd.type) {
      case "noteOn": {
        const legato = cmd.legato;
        const idx = this.allocator.noteOn(cmd.note, cmd.velocity, legato);
        const voice = at(
          this.allocator.voices as unknown[],
          idx,
        ) as (typeof this.allocator.voices)[number];

        // If voice is stealing, don't touch oscillators/envelopes yet —
        // the old voice continues rendering during the 5ms crossfade.
        // The processor will apply the new note when steal completes.
        if (voice.state === "stealing") {
          return;
        }

        this.applyNoteOn(idx, cmd.note, cmd.velocity, legato);
        break;
      }

      case "noteOff": {
        const idx = this.allocator.noteOff(cmd.note);
        if (idx >= 0) {
          const vd = at(this.voiceData, idx);
          vd.ampEnv.release();
          vd.filterEnv.release();
        }
        break;
      }

      case "allNotesOff":
        // S1-4: Must also update allocator state
        for (let i = 0; i < MAX_VOICES; i++) {
          const voice = at(
            this.allocator.voices as unknown[],
            i,
          ) as (typeof this.allocator.voices)[number];
          if (voice.state === "active") {
            (voice as { state: string }).state = "releasing";
          }
          at(this.voiceData, i).ampEnv.release();
          at(this.voiceData, i).filterEnv.release();
        }
        break;

      case "setParam":
        this.setParamValue(cmd.key, cmd.value);
        break;
    }
  }

  /** Apply a note-on to voice oscillators and envelopes */
  private applyNoteOn(
    idx: number,
    note: number,
    velocity: number,
    legato: boolean,
  ): void {
    const vd = at(this.voiceData, idx);

    const baseFreq = midiToFreq(note);
    vd.targetFreq = baseFreq;
    vd.velocity = velocity / 127;

    if (!legato || vd.currentFreq === 0) {
      vd.currentFreq = baseFreq;
    }

    if (!legato) {
      vd.osc1.reset();
      vd.osc2.reset();
      vd.filter.reset();
    }

    vd.osc1.type = this.params.osc1Type;
    vd.osc2.type = this.params.osc2Type;
    vd.filter.type = this.params.filterType;

    vd.ampEnv.gate(legato);
    vd.filterEnv.gate(legato);
  }

  private setParamValue(key: string, value: number): void {
    switch (key) {
      case "osc1Type":
        this.params.osc1Type = WAVEFORM_TYPES[Math.round(value)] ?? "saw";
        break;
      case "osc2Type":
        this.params.osc2Type = WAVEFORM_TYPES[Math.round(value)] ?? "saw";
        break;
      case "filterType": {
        const ft = FILTER_TYPES[Math.round(value)] ?? "lowpass";
        this.params.filterType = ft;
        for (let i = 0; i < MAX_VOICES; i++) {
          at(this.voiceData, i).filter.type = ft;
        }
        break;
      }
      case "lfo1Shape":
        this.params.lfo1Shape = LFO_SHAPES[Math.round(value)] ?? "sine";
        this.lfo1.shape = this.params.lfo1Shape;
        break;
      case "lfo2Shape":
        this.params.lfo2Shape = LFO_SHAPES[Math.round(value)] ?? "sine";
        this.lfo2.shape = this.params.lfo2Shape;
        break;
      default:
        (this.params as Record<string, unknown>)[key] = value;
        break;
    }
  }

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>,
  ): boolean {
    const output = outputs[0];
    if (!output) return this.alive;

    const outL = output[0];
    const outR = output[1] ?? output[0];
    if (!outL || !outR) return this.alive;

    const numSamples = outL.length;
    const sr = sampleRate;
    const p = this.params;

    // Update pre-allocated ADSR params in-place (S2-3)
    this.ampParams.attack = p.ampAttack;
    this.ampParams.decay = p.ampDecay;
    this.ampParams.sustain = p.ampSustain;
    this.ampParams.release = p.ampRelease;

    this.filterParams.attack = p.filterAttack;
    this.filterParams.decay = p.filterDecay;
    this.filterParams.sustain = p.filterSustain;
    this.filterParams.release = p.filterRelease;

    for (let s = 0; s < numSamples; s++) {
      const lfo1Val = this.lfo1.process(p.lfo1Rate, sr);
      const lfo2Val = this.lfo2.process(p.lfo2Rate, sr);

      let mixL = 0;
      let mixR = 0;

      for (let vi = 0; vi < MAX_VOICES; vi++) {
        const voice = at(this.allocator.voices as unknown[], vi) as {
          state: string;
          stealFadeGain: number;
        };

        // S2-5: Early idle check before any DSP work
        if (voice.state === "idle") continue;

        const vd = at(this.voiceData, vi);

        // Check if envelope finished release — mark idle before processing
        if (vd.ampEnv.stage === "idle" && voice.state === "releasing") {
          this.allocator.markIdle(vi);
          continue;
        }

        // Pitch glide (R-STA-05)
        if (p.glideTime > 0 && vd.currentFreq !== vd.targetFreq) {
          const glideCoeff = 1 - Math.exp(-1 / (p.glideTime * sr));
          vd.currentFreq += glideCoeff * (vd.targetFreq - vd.currentFreq);
        } else {
          vd.currentFreq = vd.targetFreq;
        }

        const baseFreq = vd.currentFreq;

        // LFO1 -> pitch modulation (in semitones)
        const pitchMod = lfo1Val * p.lfo1Depth * 2;
        const pitchMultiplier = Math.pow(2, pitchMod / 12);

        const freq1 =
          baseFreq *
          Math.pow(2, p.osc1Octave) *
          Math.pow(2, p.osc1Detune / 1200) *
          pitchMultiplier;
        const freq2 =
          baseFreq *
          Math.pow(2, p.osc2Octave) *
          Math.pow(2, p.osc2Detune / 1200) *
          pitchMultiplier;

        const osc1Out = vd.osc1.next(freq1, sr) * p.osc1Level;
        const osc2Out = vd.osc2.next(freq2, sr) * p.osc2Level;
        let sample = osc1Out + osc2Out;

        // Filter envelope -> cutoff modulation
        const filterEnvVal = vd.filterEnv.process(this.filterParams, sr);
        const envCutoffMod = filterEnvVal * p.filterEnvDepth;

        // LFO1 -> cutoff modulation
        const lfoCutoffMod = lfo1Val * p.lfo1Depth * 12;

        // Velocity -> filter modulation
        const velCutoffMod = vd.velocity * 24;

        const totalCutoffMod = envCutoffMod + lfoCutoffMod + velCutoffMod;
        const modulatedCutoff =
          p.filterCutoff * Math.pow(2, totalCutoffMod / 12);
        const clampedCutoff = Math.min(
          Math.max(modulatedCutoff, 20),
          sr / 2 - 100,
        );

        // S1-1: Write coefficients directly into filter's pre-allocated struct
        computeBiquadCoeffs(
          p.filterType,
          clampedCutoff,
          p.filterResonance,
          sr,
          vd.filter.coeffs,
        );

        // S2-6: No destructuring — filter reads from its own coeffs
        sample = vd.filter.process(sample);

        // Amplitude envelope
        const ampLevel = vd.ampEnv.process(this.ampParams, sr);

        // LFO2 -> amplitude modulation (tremolo)
        const ampMod = 1 + lfo2Val * p.lfo2Depth * 0.5;

        // Velocity -> amplitude
        const velAmp = 0.5 + vd.velocity * 0.5;

        sample *= ampLevel * ampMod * velAmp * p.masterGain;

        // S1-2: Apply steal crossfade gain to old voice audio
        if (voice.state === "stealing") {
          sample *= voice.stealFadeGain;
        }

        mixL += sample;
        mixR += sample;
      }

      // Process steal fades and get completed steals
      const completed = this.allocator.processStealFade(sr);

      // S1-3: Apply pending notes for voices that completed steal crossfade
      for (let ci = 0; ci < completed.length; ci++) {
        const completedIdx = completed[ci];
        if (completedIdx !== undefined) {
          const voice = at(
            this.allocator.voices as unknown[],
            completedIdx,
          ) as {
            note: number;
            velocity: number;
          };
          this.applyNoteOn(completedIdx, voice.note, voice.velocity, false);
        }
      }

      outL[s] = mixL;
      outR[s] = mixR;
    }

    return this.alive;
  }
}

registerProcessor("synth-processor", SynthProcessor);
