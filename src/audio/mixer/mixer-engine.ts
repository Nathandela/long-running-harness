/**
 * Mixer audio graph engine.
 * Per-track channel strips -> master bus -> brickwall limiter -> destination.
 *
 * INV-2: Non-bypassable DynamicsCompressorNode as brickwall limiter
 * (threshold=-1dBFS, ratio=20:1, knee=0, attack=0.001s)
 */

import type { ChannelStrip, MasterBus, MixerEngine } from "./types";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Quadratic fader taper: attempt to model a real mixing console fader.
 * Maps linear 0..2 -> gain curve.
 * 0 -> 0 (silence), 1 -> 1 (unity), 2 -> 2 (boost)
 */
function faderTaper(linear: number): number {
  if (linear <= 0) return 0;
  if (linear <= 1) {
    // Attempt log curve: x^2 gives reasonable taper for 0..1
    return linear * linear;
  }
  // Above unity: linear interpolation from 1..2
  return 1 + (linear - 1);
}

function createMasterBus(ctx: AudioContext): MasterBus {
  const inputGain = ctx.createGain();
  const faderGain = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  const analyser = ctx.createAnalyser();

  // INV-2: Brickwall limiter settings
  limiter.threshold.value = -1;
  limiter.ratio.value = 20;
  limiter.knee.value = 0;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.01;

  // Chain: inputGain -> faderGain -> limiter -> analyser -> destination
  inputGain.connect(faderGain);
  faderGain.connect(limiter);
  limiter.connect(analyser);
  analyser.connect(ctx.destination);

  return { inputGain, faderGain, limiter, analyser };
}

function createChannelStrip(
  ctx: AudioContext,
  trackId: string,
  masterInput: GainNode,
): ChannelStrip {
  const inputGain = ctx.createGain();
  const faderGain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const muteGain = ctx.createGain();
  const analyser = ctx.createAnalyser();

  // Chain: inputGain -> faderGain -> panner -> muteGain -> analyser -> master input
  inputGain.connect(faderGain);
  faderGain.connect(panner);
  panner.connect(muteGain);
  muteGain.connect(analyser);
  analyser.connect(masterInput);

  return {
    trackId,
    inputGain,
    inserts: [],
    faderGain,
    panner,
    muteGain,
    analyser,
    muted: false,
    solo: false,
    soloIsolate: false,
  };
}

export function createMixerEngine(ctx: AudioContext): MixerEngine {
  const master = createMasterBus(ctx);
  const strips = new Map<string, ChannelStrip>();
  let savedMasterLevel = 1;

  function applyMuteState(strip: ChannelStrip): void {
    const hasSolo = [...strips.values()].some((s) => s.solo);

    if (strip.muted) {
      strip.muteGain.gain.value = 0;
      return;
    }

    if (hasSolo) {
      if (strip.solo || strip.soloIsolate) {
        strip.muteGain.gain.value = 1;
      } else {
        strip.muteGain.gain.value = 0;
      }
    } else {
      strip.muteGain.gain.value = 1;
    }
  }

  const engine: MixerEngine = {
    getOrCreateStrip(trackId: string): ChannelStrip {
      const existing = strips.get(trackId);
      if (existing) return existing;

      const strip = createChannelStrip(ctx, trackId, master.inputGain);
      strips.set(trackId, strip);
      return strip;
    },

    removeStrip(trackId: string): void {
      const strip = strips.get(trackId);
      if (!strip) return;

      strip.inputGain.disconnect();
      strip.faderGain.disconnect();
      strip.panner.disconnect();
      strip.muteGain.disconnect();
      strip.analyser.disconnect();
      strips.delete(trackId);
    },

    getStrip(trackId: string): ChannelStrip | undefined {
      return strips.get(trackId);
    },

    getAllStrips(): readonly ChannelStrip[] {
      return [...strips.values()];
    },

    getMaster(): MasterBus {
      return master;
    },

    setFaderLevel(trackId: string, level: number): void {
      const strip = strips.get(trackId);
      if (!strip) return;
      const clamped = clamp(level, 0, 2);
      strip.faderGain.gain.value = faderTaper(clamped);
    },

    setPan(trackId: string, pan: number): void {
      const strip = strips.get(trackId);
      if (!strip) return;
      strip.panner.pan.value = clamp(pan, -1, 1);
    },

    setMute(trackId: string, muted: boolean): void {
      const strip = strips.get(trackId);
      if (!strip) return;
      strip.muted = muted;
      applyMuteState(strip);
    },

    setSolo(trackId: string, solo: boolean): void {
      const strip = strips.get(trackId);
      if (!strip) return;
      strip.solo = solo;
      engine.updateSoloState();
    },

    setSoloIsolate(trackId: string, enabled: boolean): void {
      const strip = strips.get(trackId);
      if (!strip) return;
      strip.soloIsolate = enabled;
      engine.updateSoloState();
    },

    updateSoloState(): void {
      for (const strip of strips.values()) {
        applyMuteState(strip);
      }
    },

    setMasterLevel(level: number): void {
      savedMasterLevel = clamp(level, 0, 2);
      master.faderGain.gain.value = savedMasterLevel;
    },

    getTrackInput(trackId: string): AudioNode {
      return engine.getOrCreateStrip(trackId).inputGain;
    },

    emergencyMute(): void {
      master.faderGain.gain.value = 0;
    },

    releaseEmergencyMute(): void {
      master.faderGain.gain.value = savedMasterLevel;
    },

    dispose(): void {
      for (const strip of strips.values()) {
        strip.inputGain.disconnect();
        strip.faderGain.disconnect();
        strip.panner.disconnect();
        strip.muteGain.disconnect();
        strip.analyser.disconnect();
      }
      strips.clear();
      master.inputGain.disconnect();
      master.faderGain.disconnect();
      master.limiter.disconnect();
      master.analyser.disconnect();
    },
  };

  return engine;
}
