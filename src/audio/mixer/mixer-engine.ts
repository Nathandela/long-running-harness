/**
 * Mixer audio graph engine.
 * Per-track channel strips -> master bus -> brickwall limiter -> destination.
 *
 * INV-2: Non-bypassable DynamicsCompressorNode as brickwall limiter
 * (threshold=-1dBFS, ratio=20:1, knee=0, attack=0.001s)
 */

import type { ChannelStrip, MasterBus, MixerEngine } from "./types";
import { createInsertChain, type InsertChain } from "./insert-chain";
import { faderTaper } from "./fader-taper";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
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
  const preFaderTap = ctx.createGain(); // Unity gain tap for pre-fader sends
  const faderGain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const muteGain = ctx.createGain();
  const analyser = ctx.createAnalyser();

  // Chain: inputGain -> [insert chain] -> preFaderTap -> faderGain -> panner -> muteGain -> analyser -> master input
  // Note: inputGain -> preFaderTap connection is managed by the insert chain
  preFaderTap.connect(faderGain);
  faderGain.connect(panner);
  panner.connect(muteGain);
  muteGain.connect(analyser);
  analyser.connect(masterInput);

  return {
    trackId,
    inputGain,
    inserts: [],
    preFaderTap,
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
  const insertChains = new Map<string, InsertChain>();
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
      // Insert chain between inputGain and preFaderTap
      const chain = createInsertChain(strip.inputGain, strip.preFaderTap);
      insertChains.set(trackId, chain);
      return strip;
    },

    removeStrip(trackId: string): void {
      const strip = strips.get(trackId);
      if (!strip) return;

      const chain = insertChains.get(trackId);
      chain?.dispose();
      insertChains.delete(trackId);

      strip.inputGain.disconnect();
      strip.preFaderTap.disconnect();
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

    addInsert(
      trackId: string,
      id: string,
      input: AudioNode,
      output: AudioNode,
    ): void {
      const chain = insertChains.get(trackId);
      chain?.addInsert(id, input, output);
    },

    replaceInsert(
      trackId: string,
      id: string,
      input: AudioNode,
      output: AudioNode,
    ): void {
      const chain = insertChains.get(trackId);
      chain?.replaceInsert(id, input, output);
    },

    removeInsert(trackId: string, insertId: string): void {
      const chain = insertChains.get(trackId);
      chain?.removeInsert(insertId);
    },

    emergencyMute(): void {
      master.faderGain.gain.value = 0;
    },

    releaseEmergencyMute(): void {
      master.faderGain.gain.value = savedMasterLevel;
    },

    dispose(): void {
      for (const chain of insertChains.values()) {
        chain.dispose();
      }
      insertChains.clear();
      for (const strip of strips.values()) {
        strip.inputGain.disconnect();
        strip.preFaderTap.disconnect();
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
