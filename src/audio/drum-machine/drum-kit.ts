/**
 * Sample-based drum kit engine.
 * Plays one-shot AudioBuffers through BiquadFilter + GainNode envelope.
 * Per-instrument Tone/Decay/Tune/Volume. Hi-hat mutual exclusivity.
 *
 * Uses native Web Audio nodes (per lesson L9ed0990ebe98f667).
 */

import type { MixerEngine } from "@audio/mixer/types";
import type {
  DrumInstrumentId,
  DrumInstrumentParams,
  DrumKit,
} from "./drum-types";
import { DEFAULT_INSTRUMENT_PARAMS, PARAM_RANGES } from "./drum-types";

function clampParam(key: keyof DrumInstrumentParams, value: number): number {
  const range = PARAM_RANGES[key];
  return Math.min(range.max, Math.max(range.min, value));
}

type ActiveVoice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

export function createDrumKit(
  ctx: AudioContext,
  samples: Map<DrumInstrumentId, AudioBuffer>,
): DrumKit {
  const output = ctx.createGain();
  const params = new Map<DrumInstrumentId, DrumInstrumentParams>();

  // Clone defaults
  for (const [id, defaults] of Object.entries(DEFAULT_INSTRUMENT_PARAMS)) {
    params.set(id as DrumInstrumentId, { ...defaults });
  }

  // Track active open hi-hat voice for mutual exclusivity
  let activeOH: ActiveVoice | null = null;

  function triggerOnce(
    instrumentId: DrumInstrumentId,
    time: number,
    velocity: number,
  ): ActiveVoice | null {
    const buffer = samples.get(instrumentId);
    if (!buffer) return null;

    const p = params.get(instrumentId);
    if (!p) return null;

    // AudioBufferSourceNode — sample playback
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(p.tune, time);

    // BiquadFilter — tone control (lowpass)
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(p.tone, time);

    // GainNode — volume envelope with decay
    const gain = ctx.createGain();
    const peakGain = p.volume * velocity;
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);

    // Chain: source -> filter -> gain -> output
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    source.start(time);
    source.stop(time + p.decay + 0.01);

    // Clean up on ended
    source.addEventListener("ended", () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    });

    return { source, gain };
  }

  const kit: DrumKit = {
    trigger(
      instrumentId: DrumInstrumentId,
      time: number,
      velocity: number,
      flamMs?: number,
    ): void {
      // Hi-hat mutual exclusivity: CH cuts OH
      if (instrumentId === "ch" && activeOH) {
        try {
          activeOH.gain.gain.cancelScheduledValues(time);
          activeOH.gain.gain.setValueAtTime(0, time);
          activeOH.source.stop(time + 0.001);
        } catch {
          // Source may already be stopped
        }
        activeOH = null;
      }

      const voice = triggerOnce(instrumentId, time, velocity);

      // Track open hi-hat voice
      if (instrumentId === "oh" && voice) {
        activeOH = voice;
      }

      // Flam: trigger a second quieter hit offset by flamMs
      if (flamMs !== undefined && flamMs > 0) {
        triggerOnce(instrumentId, time + flamMs / 1000, velocity * 0.7);
      }
    },

    setParam(
      instrumentId: DrumInstrumentId,
      key: keyof DrumInstrumentParams,
      value: number,
    ): void {
      const p = params.get(instrumentId);
      if (!p) return;
      (p as Record<string, number>)[key] = clampParam(key, value);
    },

    connectToMixer(mixer: MixerEngine, trackId: string): void {
      const strip = mixer.getOrCreateStrip(trackId);
      output.connect(strip.inputGain);
    },

    disconnectFromMixer(_mixer: MixerEngine, _trackId: string): void {
      output.disconnect();
    },

    dispose(): void {
      output.disconnect();
    },
  };

  return kit;
}
