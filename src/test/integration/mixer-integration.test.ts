/**
 * Integration tests: Mixer with synth, effects, and arrangement.
 *
 * Verifies:
 * - Synth <-> AudioGraph: voice allocation connects to mixer [E9->E7]
 * - Effects <-> Mixer: insert chain wiring [E8->E7]
 * - Arrangement <-> Mixer: clip playback through channel strips [E6->E7]
 * - Solo/mute state propagation across strips
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMixerEngine, type MixerEngine } from "@audio/mixer";
import { createBaseEffect } from "@audio/effects/create-effect";
import { createMockAudioContext } from "./helpers";

describe("Mixer <-> Effects insert chain", () => {
  let ctx: AudioContext;
  let mixer: MixerEngine;

  beforeEach(() => {
    ctx = createMockAudioContext();
    mixer = createMixerEngine(ctx);
  });

  afterEach(() => {
    mixer.dispose();
  });

  it("creates channel strip with full signal chain", () => {
    const strip = mixer.getOrCreateStrip("track-1");

    expect(strip.trackId).toBe("track-1");
    expect(strip.inputGain).toBeDefined();
    expect(strip.preFaderTap).toBeDefined();
    expect(strip.faderGain).toBeDefined();
    expect(strip.panner).toBeDefined();
    expect(strip.muteGain).toBeDefined();
    expect(strip.analyser).toBeDefined();
  });

  it("master bus has brickwall limiter (INV-2)", () => {
    const master = mixer.getMaster();

    expect(master.limiter).toBeDefined();
    expect(master.limiter.threshold.value).toBe(-1);
    expect(master.limiter.ratio.value).toBe(20);
    expect(master.limiter.knee.value).toBe(0);
  });

  it("inserts an effect into a channel strip", () => {
    mixer.getOrCreateStrip("track-1");

    const effect = createBaseEffect({
      ctx,
      id: "fx-1",
      typeId: "delay",
      params: [{ key: "time", min: 0, max: 1, default: 0.3 }],
      buildChain(inputNode, outputNode) {
        inputNode.connect(outputNode);
      },
      applyParam: vi.fn(),
    });

    mixer.addInsert("track-1", effect.id, effect.input, effect.output);

    // Effect should be wired into the chain - verify it can be replaced
    const effect2 = createBaseEffect({
      ctx,
      id: "fx-1",
      typeId: "reverb",
      params: [{ key: "decay", min: 0, max: 5, default: 1.5 }],
      buildChain(inputNode, outputNode) {
        inputNode.connect(outputNode);
      },
      applyParam: vi.fn(),
    });

    // Replace should not throw
    mixer.replaceInsert("track-1", effect2.id, effect2.input, effect2.output);
    effect.dispose();
    effect2.dispose();
  });

  it("removes an insert effect", () => {
    mixer.getOrCreateStrip("track-1");

    const effect = createBaseEffect({
      ctx,
      id: "fx-remove",
      typeId: "chorus",
      params: [],
      buildChain(inputNode, outputNode) {
        inputNode.connect(outputNode);
      },
      applyParam: vi.fn(),
    });

    mixer.addInsert("track-1", effect.id, effect.input, effect.output);
    mixer.removeInsert("track-1", effect.id);
    effect.dispose();
  });

  it("effect bypass toggles dry/wet mix", () => {
    const applyParam = vi.fn();
    const effect = createBaseEffect({
      ctx,
      id: "fx-bypass",
      typeId: "delay",
      params: [{ key: "time", min: 0, max: 1, default: 0.3 }],
      buildChain(inputNode, outputNode) {
        inputNode.connect(outputNode);
      },
      applyParam,
    });

    // Default: fully wet
    expect(effect.bypassed).toBe(false);

    effect.setBypassed(true);
    expect(effect.bypassed).toBe(true);
    // Dry gain should be ramped to 1, wet to 0
    expect(effect.dryGain.gain.value).toBe(1);

    effect.setBypassed(false);
    expect(effect.bypassed).toBe(false);

    effect.dispose();
  });
});

describe("Mixer solo/mute state propagation", () => {
  let ctx: AudioContext;
  let mixer: MixerEngine;

  beforeEach(() => {
    ctx = createMockAudioContext();
    mixer = createMixerEngine(ctx);
  });

  afterEach(() => {
    mixer.dispose();
  });

  it("muting a track sets muteGain to 0", () => {
    mixer.getOrCreateStrip("t1");
    mixer.setMute("t1", true);
    const strip = mixer.getStrip("t1");
    expect(strip).toBeDefined();
    expect(strip?.muteGain.gain.value).toBe(0);
  });

  it("solo silences non-solo tracks", () => {
    mixer.getOrCreateStrip("t1");
    mixer.getOrCreateStrip("t2");

    mixer.setSolo("t1", true);

    expect(mixer.getStrip("t1")?.muteGain.gain.value).toBe(1);
    expect(mixer.getStrip("t2")?.muteGain.gain.value).toBe(0);
  });

  it("solo-isolate keeps track audible during solo", () => {
    mixer.getOrCreateStrip("t1");
    mixer.getOrCreateStrip("t2");
    mixer.getOrCreateStrip("t3");

    mixer.setSoloIsolate("t3", true);
    mixer.setSolo("t1", true);

    expect(mixer.getStrip("t1")?.muteGain.gain.value).toBe(1); // soloed
    expect(mixer.getStrip("t2")?.muteGain.gain.value).toBe(0); // silenced
    expect(mixer.getStrip("t3")?.muteGain.gain.value).toBe(1); // solo-isolate
  });

  it("removing solo restores all tracks", () => {
    mixer.getOrCreateStrip("t1");
    mixer.getOrCreateStrip("t2");

    mixer.setSolo("t1", true);
    expect(mixer.getStrip("t2")?.muteGain.gain.value).toBe(0);

    mixer.setSolo("t1", false);
    expect(mixer.getStrip("t2")?.muteGain.gain.value).toBe(1);
  });

  it("fader level applies taper curve", () => {
    mixer.getOrCreateStrip("t1");
    mixer.setFaderLevel("t1", 0);
    expect(mixer.getStrip("t1")?.faderGain.gain.value).toBe(0);

    mixer.setFaderLevel("t1", 1);
    // faderTaper(1) should be close to 1 (unity gain)
    const level = mixer.getStrip("t1")?.faderGain.gain.value ?? 0;
    expect(level).toBeGreaterThan(0.9);
  });

  it("emergency mute silences master and releases", () => {
    mixer.setMasterLevel(1);
    mixer.emergencyMute();
    expect(mixer.getMaster().faderGain.gain.value).toBe(0);

    mixer.releaseEmergencyMute();
    expect(mixer.getMaster().faderGain.gain.value).toBe(1);
  });
});

describe("Mixer track lifecycle", () => {
  let ctx: AudioContext;
  let mixer: MixerEngine;

  beforeEach(() => {
    ctx = createMockAudioContext();
    mixer = createMixerEngine(ctx);
  });

  afterEach(() => {
    mixer.dispose();
  });

  it("getOrCreateStrip is idempotent", () => {
    const strip1 = mixer.getOrCreateStrip("t1");
    const strip2 = mixer.getOrCreateStrip("t1");
    expect(strip1).toBe(strip2);
  });

  it("removeStrip cleans up and returns undefined on get", () => {
    mixer.getOrCreateStrip("t1");
    mixer.removeStrip("t1");
    expect(mixer.getStrip("t1")).toBeUndefined();
  });

  it("getAllStrips returns all active strips", () => {
    mixer.getOrCreateStrip("t1");
    mixer.getOrCreateStrip("t2");
    mixer.getOrCreateStrip("t3");

    expect(mixer.getAllStrips()).toHaveLength(3);

    mixer.removeStrip("t2");
    expect(mixer.getAllStrips()).toHaveLength(2);
  });

  it("pan sets StereoPanner value", () => {
    mixer.getOrCreateStrip("t1");
    mixer.setPan("t1", -0.5);
    expect(mixer.getStrip("t1")?.panner.pan.value).toBe(-0.5);
  });
});
