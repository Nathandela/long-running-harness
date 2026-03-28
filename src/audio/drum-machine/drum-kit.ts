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

  // Track active open hi-hat voices for mutual exclusivity (primary + flam)
  let activeOH: ActiveVoice | null = null;
  let activeOHFlam: ActiveVoice | null = null;

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
    // Clamp velocity to [0,1] and ensure peakGain > 0 for exponentialRamp
    const peakGain = Math.max(0.001, p.volume * Math.min(1, velocity));
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
      // Clear stale OH reference when voice decays naturally
      if (instrumentId === "oh") {
        if (activeOH?.source === source) activeOH = null;
        if (activeOHFlam?.source === source) activeOHFlam = null;
      }
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
      // Hi-hat mutual exclusivity: CH cuts OH (primary + flam)
      if (instrumentId === "ch") {
        for (const voice of [activeOH, activeOHFlam]) {
          if (voice) {
            try {
              voice.gain.gain.cancelScheduledValues(time);
              voice.gain.gain.setValueAtTime(0, time);
              voice.source.stop(time + 0.001);
            } catch {
              // Source may already be stopped
            }
          }
        }
        activeOH = null;
        activeOHFlam = null;
      }

      const voice = triggerOnce(instrumentId, time, velocity);

      // Track open hi-hat voice
      if (instrumentId === "oh" && voice) {
        activeOH = voice;
      }

      // Flam: trigger a second quieter hit offset by flamMs
      if (flamMs !== undefined && flamMs > 0) {
        const flamVoice = triggerOnce(
          instrumentId,
          time + flamMs / 1000,
          velocity * 0.7,
        );
        if (instrumentId === "oh" && flamVoice) {
          activeOHFlam = flamVoice;
        }
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

    disconnectFromMixer(mixer: MixerEngine, trackId: string): void {
      const strip = mixer.getOrCreateStrip(trackId);
      output.disconnect(strip.inputGain);
    },

    dispose(): void {
      output.disconnect();
    },
  };

  return kit;
}
