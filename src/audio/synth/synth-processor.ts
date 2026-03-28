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
import {
  createModAccumulators,
  resetAccumulators,
  applyModRoute,
  type ModAccumulators,
  type WorkletModRoute,
  SOURCE_INDEX,
} from "./modulation-engine";

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

  // Modulation matrix (pre-allocated, zero-allocation in process())
  private modRoutes: WorkletModRoute[] = [];
  private modSourceValues = new Float64Array(8); // Global source values
  private voiceSrcValues = new Float64Array(8); // Per-voice source values
  private modAccGlobal: ModAccumulators = createModAccumulators();
  private modAccVoice: ModAccumulators = createModAccumulators();

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
          } else if (voice.state === "stealing") {
            // Cancel pending steal — clear pending note and release
            (voice as { state: string }).state = "releasing";
            (voice as { pendingNote: number }).pendingNote = -1;
            (voice as { pendingVelocity: number }).pendingVelocity = 0;
          }
          at(this.voiceData, i).ampEnv.release();
          at(this.voiceData, i).filterEnv.release();
        }
        break;

      case "setParam":
        this.setParamValue(cmd.key, cmd.value);
        break;

      case "setModRoutes":
        this.modRoutes = cmd.routes;
        break;

      case "setModSource": {
        // Update global mod source values (aftertouch, modwheel, pitchbend)
        const srcKey = cmd.source as keyof typeof SOURCE_INDEX;
        if (srcKey in SOURCE_INDEX) {
          this.modSourceValues[SOURCE_INDEX[srcKey]] = cmd.value;
        }
        break;
      }
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

    // Pre-compute control-rate values (constant across quantum)
    const osc1OctMul = Math.pow(2, p.osc1Octave);
    const osc1DetMul = Math.pow(2, p.osc1Detune / 1200);
    const osc2OctMul = Math.pow(2, p.osc2Octave);
    const osc2DetMul = Math.pow(2, p.osc2Detune / 1200);

    for (let s = 0; s < numSamples; s++) {
      // LFO rates incorporate modulation from previous sample (1-sample delay, inaudible)
      const lfo1Rate = Math.max(0.01, p.lfo1Rate + this.modAccGlobal.lfo1Rate);
      const lfo2Rate = Math.max(0.01, p.lfo2Rate + this.modAccGlobal.lfo2Rate);
      const lfo1Val = this.lfo1.process(lfo1Rate, sr);
      const lfo2Val = this.lfo2.process(lfo2Rate, sr);

      // Update global source values for modulation (scaled by depth)
      this.modSourceValues[SOURCE_INDEX.lfo1] = lfo1Val * p.lfo1Depth;
      this.modSourceValues[SOURCE_INDEX.lfo2] = lfo2Val * p.lfo2Depth;

      // Compute global modulation (from non-per-voice sources)
      resetAccumulators(this.modAccGlobal);
      for (let ri = 0; ri < this.modRoutes.length; ri++) {
        const route = at(this.modRoutes as unknown[], ri) as WorkletModRoute;
        // Global sources: lfo1, lfo2, aftertouch, modWheel, pitchBend
        const si = route.sourceIdx;
        if (
          si === SOURCE_INDEX.lfo1 ||
          si === SOURCE_INDEX.lfo2 ||
          si === SOURCE_INDEX.aftertouch ||
          si === SOURCE_INDEX.modWheel ||
          si === SOURCE_INDEX.pitchBend
        ) {
          applyModRoute(
            this.modAccGlobal,
            this.modSourceValues,
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

        // Filter envelope (must process every sample to advance state)
        const filterEnvVal = vd.filterEnv.process(this.filterParams, sr);
        // Amplitude envelope
        const ampLevel = vd.ampEnv.process(this.ampParams, sr);

        // Compute per-voice modulation
        resetAccumulators(this.modAccVoice);
        if (this.modRoutes.length > 0) {
          // Set per-voice source values
          this.voiceSrcValues[SOURCE_INDEX.ampEnv] = ampLevel;
          this.voiceSrcValues[SOURCE_INDEX.filterEnv] = filterEnvVal;
          this.voiceSrcValues[SOURCE_INDEX.velocity] = vd.velocity;

          for (let ri = 0; ri < this.modRoutes.length; ri++) {
            const route = at(
              this.modRoutes as unknown[],
              ri,
            ) as WorkletModRoute;
            const si = route.sourceIdx;
            // Per-voice sources: ampEnv, filterEnv, velocity
            if (
              si === SOURCE_INDEX.ampEnv ||
              si === SOURCE_INDEX.filterEnv ||
              si === SOURCE_INDEX.velocity
            ) {
              applyModRoute(
                this.modAccVoice,
                this.voiceSrcValues,
                si,
                route.destIdx,
                route.amount,
                route.bipolar,
              );
            }
          }
        }

        // Combined modulation (global + per-voice)
        const modPitchOsc1 =
          this.modAccGlobal.osc1Pitch + this.modAccVoice.osc1Pitch;
        const modPitchOsc2 =
          this.modAccGlobal.osc2Pitch + this.modAccVoice.osc2Pitch;
        const modFilterCutoff =
          this.modAccGlobal.filterCutoff + this.modAccVoice.filterCutoff;
        const modFilterReso =
          this.modAccGlobal.filterResonance + this.modAccVoice.filterResonance;
        const modAmpLevel =
          this.modAccGlobal.ampLevel + this.modAccVoice.ampLevel;
        const modOscMix = this.modAccGlobal.oscMix + this.modAccVoice.oscMix;

        // Pitch modulation (scaled to semitones, max +/-24)
        const pitchMod1 = modPitchOsc1 * 24;
        const pitchMod2 = modPitchOsc2 * 24;
        const pitchMult1 = Math.pow(2, pitchMod1 / 12);
        const pitchMult2 = Math.pow(2, pitchMod2 / 12);

        const freq1 = baseFreq * osc1OctMul * osc1DetMul * pitchMult1;
        const freq2 = baseFreq * osc2OctMul * osc2DetMul * pitchMult2;

        const osc1Out = vd.osc1.next(freq1, sr) * p.osc1Level;
        const osc2Out = vd.osc2.next(freq2, sr) * p.osc2Level;

        // Osc mix: without modulation, both oscs play at full level.
        // oscMix modulation crossfades: negative = more osc1, positive = more osc2
        const osc1Gain = Math.max(0, Math.min(1, 1 - modOscMix));
        const osc2Gain = Math.max(0, Math.min(1, 1 + modOscMix));
        let sample = osc1Out * osc1Gain + osc2Out * osc2Gain;

        // Control-rate filter coefficients: recompute once per block per voice.
        // Trade-off: fast LFO modulation of cutoff uses only sample-0 values
        // for the entire 128-sample block. Per-sample recomputation is too
        // expensive; audible zipper artifacts are minimal at typical LFO rates.
        if (s === 0) {
          // Filter cutoff modulation (in semitones)
          const cutoffModSt =
            filterEnvVal * p.filterEnvDepth + modFilterCutoff * 60;
          const modulatedCutoff =
            p.filterCutoff * Math.pow(2, cutoffModSt / 12);
          const clampedCutoff = Math.min(
            Math.max(modulatedCutoff, 20),
            sr / 2 - 100,
          );
          // Filter resonance modulation
          const modulatedReso = Math.max(
            0.5,
            Math.min(20, p.filterResonance + modFilterReso * 10),
          );
          computeBiquadCoeffs(
            p.filterType,
            clampedCutoff,
            modulatedReso,
            sr,
            vd.filter.coeffs,
          );
        }

        sample = vd.filter.process(sample);

        // Amplitude modulation: base envelope * (1 + mod offset)
        const ampMod = Math.max(0, 1 + modAmpLevel);

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
      for (let ci = 0; ci < completed.count; ci++) {
        const completedIdx = completed.data[ci];
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
