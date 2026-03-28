import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMixerEngine } from "./mixer-engine";
import type { MixerEngine } from "./types";

type MockNode = {
  gain: {
    value: number;
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

function asMock(node: AudioNode): MockNode {
  return node as unknown as MockNode;
}

function createMockAudioContext(): AudioContext {
  const mockGainNode = (): MockNode => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockAnalyser = (): MockNode => ({
    ...mockGainNode(),
    ...{
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      getFloatTimeDomainData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
    },
  });

  const mockPanner = (): object => ({
    pan: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockCompressor = (): object => ({
    threshold: { value: -24, setValueAtTime: vi.fn() },
    ratio: { value: 12, setValueAtTime: vi.fn() },
    knee: { value: 30, setValueAtTime: vi.fn() },
    attack: { value: 0.003, setValueAtTime: vi.fn() },
    release: { value: 0.25, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  return {
    createGain: vi.fn().mockImplementation(mockGainNode),
    createAnalyser: vi.fn().mockImplementation(mockAnalyser),
    createStereoPanner: vi.fn().mockImplementation(mockPanner),
    createDynamicsCompressor: vi.fn().mockImplementation(mockCompressor),
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    currentTime: 0,
    sampleRate: 44100,
  } as unknown as AudioContext;
}

describe("MixerEngine", () => {
  let ctx: AudioContext;
  let mixer: MixerEngine;

  beforeEach(() => {
    ctx = createMockAudioContext();
    mixer = createMixerEngine(ctx);
  });

  describe("master bus", () => {
    it("creates master bus with limiter", () => {
      const master = mixer.getMaster();
      expect(master.inputGain).toBeDefined();
      expect(master.faderGain).toBeDefined();
      expect(master.limiter).toBeDefined();
      expect(master.analyser).toBeDefined();
    });

    it("sets limiter to brickwall settings (INV-2)", () => {
      const master = mixer.getMaster();
      const limiter = master.limiter;
      expect(limiter.threshold.value).toBe(-1);
      expect(limiter.ratio.value).toBe(20);
      expect(limiter.knee.value).toBe(0);
      expect(limiter.attack.value).toBeCloseTo(0.001, 3);
    });

    it("connects master chain: inputGain -> faderGain -> limiter -> analyser -> destination", () => {
      const master = mixer.getMaster();
      expect(asMock(master.inputGain).connect).toHaveBeenCalledWith(
        master.faderGain,
      );
      expect(asMock(master.faderGain).connect).toHaveBeenCalledWith(
        master.limiter,
      );
      expect(asMock(master.limiter).connect).toHaveBeenCalledWith(
        master.analyser,
      );
      expect(asMock(master.analyser).connect).toHaveBeenCalledWith(
        ctx.destination,
      );
    });

    it("sets master fader level", () => {
      mixer.setMasterLevel(0.5);
      const master = mixer.getMaster();
      expect(master.faderGain.gain.value).toBeCloseTo(0.5);
    });
  });

  describe("channel strips", () => {
    it("creates a channel strip for a track", () => {
      const strip = mixer.getOrCreateStrip("track-1");
      expect(strip.trackId).toBe("track-1");
      expect(strip.inputGain).toBeDefined();
      expect(strip.faderGain).toBeDefined();
      expect(strip.panner).toBeDefined();
      expect(strip.muteGain).toBeDefined();
      expect(strip.analyser).toBeDefined();
      expect(strip.inserts).toEqual([]);
    });

    it("returns same strip for same trackId", () => {
      const a = mixer.getOrCreateStrip("track-1");
      const b = mixer.getOrCreateStrip("track-1");
      expect(a).toBe(b);
    });

    it("connects strip chain: inputGain -> faderGain -> panner -> muteGain -> analyser -> master input", () => {
      const strip = mixer.getOrCreateStrip("track-1");
      const master = mixer.getMaster();
      expect(asMock(strip.inputGain).connect).toHaveBeenCalledWith(
        strip.faderGain,
      );
      expect(asMock(strip.faderGain).connect).toHaveBeenCalledWith(
        strip.panner,
      );
      expect(asMock(strip.panner).connect).toHaveBeenCalledWith(strip.muteGain);
      expect(asMock(strip.muteGain).connect).toHaveBeenCalledWith(
        strip.analyser,
      );
      expect(asMock(strip.analyser).connect).toHaveBeenCalledWith(
        master.inputGain,
      );
    });

    it("removes a channel strip", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.removeStrip("track-1");
      expect(mixer.getStrip("track-1")).toBeUndefined();
    });

    it("getAllStrips returns all strips", () => {
      mixer.getOrCreateStrip("a");
      mixer.getOrCreateStrip("b");
      expect(mixer.getAllStrips()).toHaveLength(2);
    });
  });

  describe("fader (logarithmic taper)", () => {
    it("sets fader gain value", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setFaderLevel("track-1", 1.0);
      const strip = mixer.getStrip("track-1");
      expect(strip?.faderGain.gain.value).toBeCloseTo(1.0);
    });

    it("clamps fader to 0..2 range", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setFaderLevel("track-1", -1);
      expect(mixer.getStrip("track-1")?.faderGain.gain.value).toBeCloseTo(0);
      mixer.setFaderLevel("track-1", 5);
      expect(mixer.getStrip("track-1")?.faderGain.gain.value).toBeCloseTo(2);
    });

    it("applies logarithmic taper: 0 maps to 0 gain", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setFaderLevel("track-1", 0);
      expect(mixer.getStrip("track-1")?.faderGain.gain.value).toBe(0);
    });
  });

  describe("pan", () => {
    it("sets pan value", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setPan("track-1", -0.5);
      expect(mixer.getStrip("track-1")?.panner.pan.value).toBeCloseTo(-0.5);
    });

    it("clamps pan to -1..1", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setPan("track-1", -5);
      expect(mixer.getStrip("track-1")?.panner.pan.value).toBeCloseTo(-1);
      mixer.setPan("track-1", 5);
      expect(mixer.getStrip("track-1")?.panner.pan.value).toBeCloseTo(1);
    });
  });

  describe("mute", () => {
    it("sets mute gain to 0 when muted", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setMute("track-1", true);
      expect(mixer.getStrip("track-1")?.muteGain.gain.value).toBe(0);
      expect(mixer.getStrip("track-1")?.muted).toBe(true);
    });

    it("sets mute gain to 1 when unmuted", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setMute("track-1", true);
      mixer.setMute("track-1", false);
      expect(mixer.getStrip("track-1")?.muteGain.gain.value).toBe(1);
      expect(mixer.getStrip("track-1")?.muted).toBe(false);
    });
  });

  describe("solo-in-place (R-STA-04)", () => {
    it("solos a track and mutes others", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.getOrCreateStrip("track-2");
      mixer.getOrCreateStrip("track-3");

      mixer.setSolo("track-1", true);
      mixer.updateSoloState();

      expect(mixer.getStrip("track-1")?.muteGain.gain.value).toBe(1);
      expect(mixer.getStrip("track-2")?.muteGain.gain.value).toBe(0);
      expect(mixer.getStrip("track-3")?.muteGain.gain.value).toBe(0);
    });

    it("handles multiple solos", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.getOrCreateStrip("track-2");
      mixer.getOrCreateStrip("track-3");

      mixer.setSolo("track-1", true);
      mixer.setSolo("track-2", true);
      mixer.updateSoloState();

      expect(mixer.getStrip("track-1")?.muteGain.gain.value).toBe(1);
      expect(mixer.getStrip("track-2")?.muteGain.gain.value).toBe(1);
      expect(mixer.getStrip("track-3")?.muteGain.gain.value).toBe(0);
    });

    it("solo-isolate keeps track audible during solo", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.getOrCreateStrip("track-2");
      mixer.getOrCreateStrip("track-3");

      mixer.setSoloIsolate("track-3", true);
      mixer.setSolo("track-1", true);
      mixer.updateSoloState();

      expect(mixer.getStrip("track-1")?.muteGain.gain.value).toBe(1);
      expect(mixer.getStrip("track-2")?.muteGain.gain.value).toBe(0);
      expect(mixer.getStrip("track-3")?.muteGain.gain.value).toBe(1);
    });

    it("respects explicit mute even when soloed", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.setMute("track-1", true);
      mixer.setSolo("track-1", true);
      mixer.updateSoloState();

      expect(mixer.getStrip("track-1")?.muteGain.gain.value).toBe(0);
    });

    it("unmuting all solos restores normal state", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.getOrCreateStrip("track-2");

      mixer.setSolo("track-1", true);
      mixer.updateSoloState();
      expect(mixer.getStrip("track-2")?.muteGain.gain.value).toBe(0);

      mixer.setSolo("track-1", false);
      mixer.updateSoloState();
      expect(mixer.getStrip("track-2")?.muteGain.gain.value).toBe(1);
    });
  });

  describe("emergency mute", () => {
    it("mutes master on emergency", () => {
      mixer.emergencyMute();
      expect(mixer.getMaster().faderGain.gain.value).toBe(0);
    });

    it("releases emergency mute", () => {
      mixer.setMasterLevel(0.8);
      mixer.emergencyMute();
      mixer.releaseEmergencyMute();
      expect(mixer.getMaster().faderGain.gain.value).toBeCloseTo(0.8);
    });
  });

  describe("getTrackInput", () => {
    it("returns the inputGain node for a track", () => {
      const strip = mixer.getOrCreateStrip("track-1");
      expect(mixer.getTrackInput("track-1")).toBe(strip.inputGain);
    });
  });

  describe("dispose", () => {
    it("disconnects all nodes", () => {
      mixer.getOrCreateStrip("track-1");
      mixer.getOrCreateStrip("track-2");
      mixer.dispose();
      expect(mixer.getAllStrips()).toHaveLength(0);
    });
  });
});
