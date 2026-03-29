import { describe, it, expect } from "vitest";
import {
  DRUM_INSTRUMENTS,
  DEFAULT_INSTRUMENT_PARAMS,
  DRUM_TO_PITCH,
  createEmptyPattern,
  mapPitchToDrum,
} from "./drum-types";
import type { DrumStep, DrumTrigger, DrumKit } from "./drum-types";

describe("DRUM_INSTRUMENTS", () => {
  it("contains exactly 11 instruments", () => {
    expect(DRUM_INSTRUMENTS).toHaveLength(11);
  });

  it("contains all expected instrument ids", () => {
    const ids = DRUM_INSTRUMENTS.map((i) => i.id);
    expect(ids).toContain("bd");
    expect(ids).toContain("sd");
    expect(ids).toContain("lt");
    expect(ids).toContain("mt");
    expect(ids).toContain("ht");
    expect(ids).toContain("rs");
    expect(ids).toContain("cp");
    expect(ids).toContain("cb");
    expect(ids).toContain("oh");
    expect(ids).toContain("ch");
    expect(ids).toContain("cy");
  });

  it("each instrument has a label", () => {
    for (const inst of DRUM_INSTRUMENTS) {
      expect(inst.label).toBeTruthy();
    }
  });
});

describe("DEFAULT_INSTRUMENT_PARAMS", () => {
  it("provides defaults for all 11 instruments", () => {
    const ids = DRUM_INSTRUMENTS.map((i) => i.id);
    for (const id of ids) {
      const params = DEFAULT_INSTRUMENT_PARAMS[id];
      expect(params).toBeDefined();
    }
  });

  it("each default has tone, decay, tune, volume in valid ranges", () => {
    for (const id of DRUM_INSTRUMENTS.map((i) => i.id)) {
      const p = DEFAULT_INSTRUMENT_PARAMS[id];
      expect(p.tone).toBeGreaterThanOrEqual(200);
      expect(p.tone).toBeLessThanOrEqual(20000);
      expect(p.decay).toBeGreaterThanOrEqual(0.01);
      expect(p.decay).toBeLessThanOrEqual(2);
      expect(p.tune).toBeGreaterThanOrEqual(0.5);
      expect(p.tune).toBeLessThanOrEqual(2);
      expect(p.volume).toBeGreaterThanOrEqual(0);
      expect(p.volume).toBeLessThanOrEqual(1);
    }
  });
});

describe("createEmptyPattern", () => {
  it("creates a pattern with 16 steps", () => {
    const pattern = createEmptyPattern();
    expect(pattern.steps).toHaveLength(16);
  });

  it("all steps are off with no accent or flam", () => {
    const pattern = createEmptyPattern();
    for (const step of pattern.steps) {
      for (const id of DRUM_INSTRUMENTS.map((i) => i.id)) {
        expect(step.triggers[id]).toBe(false);
      }
      expect(step.accent).toBe(false);
      expect(step.flamMs).toBe(0);
    }
  });

  it("has a name", () => {
    const pattern = createEmptyPattern("A");
    expect(pattern.name).toBe("A");
  });
});

describe("DRUM_TO_PITCH", () => {
  it("maps all 11 instruments to MIDI pitches", () => {
    for (const inst of DRUM_INSTRUMENTS) {
      expect(DRUM_TO_PITCH[inst.id]).toBeDefined();
      expect(DRUM_TO_PITCH[inst.id]).toBeGreaterThanOrEqual(35);
      expect(DRUM_TO_PITCH[inst.id]).toBeLessThanOrEqual(127);
    }
  });
});

describe("mapPitchToDrum", () => {
  it("maps primary GM pitches to correct drum ids", () => {
    expect(mapPitchToDrum(36)).toBe("bd");
    expect(mapPitchToDrum(38)).toBe("sd");
    expect(mapPitchToDrum(42)).toBe("ch");
    expect(mapPitchToDrum(46)).toBe("oh");
    expect(mapPitchToDrum(39)).toBe("cp");
  });

  it("maps alternate pitches", () => {
    expect(mapPitchToDrum(35)).toBe("bd");
    expect(mapPitchToDrum(40)).toBe("sd");
    expect(mapPitchToDrum(44)).toBe("ch");
    expect(mapPitchToDrum(51)).toBe("cy");
  });

  it("returns undefined for unmapped pitches", () => {
    expect(mapPitchToDrum(60)).toBeUndefined();
    expect(mapPitchToDrum(0)).toBeUndefined();
  });

  it("round-trips via DRUM_TO_PITCH", () => {
    for (const inst of DRUM_INSTRUMENTS) {
      const pitch = DRUM_TO_PITCH[inst.id];
      expect(mapPitchToDrum(pitch)).toBe(inst.id);
    }
  });
});

describe("type contracts", () => {
  it("DrumStep has triggers map, accent flag, and flamMs", () => {
    const step: DrumStep = {
      triggers: {
        bd: true,
        sd: false,
        lt: false,
        mt: false,
        ht: false,
        rs: false,
        cp: false,
        cb: false,
        oh: false,
        ch: false,
        cy: false,
      },
      accent: true,
      flamMs: 10,
    };
    expect(step.accent).toBe(true);
    expect(step.flamMs).toBe(10);
    expect(step.triggers.bd).toBe(true);
  });

  it("DrumTrigger has instrumentId, time, velocity, and optional flamMs", () => {
    const trigger: DrumTrigger = {
      instrumentId: "bd",
      time: 0.5,
      velocity: 0.8,
    };
    expect(trigger.instrumentId).toBe("bd");
    expect(trigger.time).toBe(0.5);
    expect(trigger.velocity).toBe(0.8);
  });

  it("DrumTrigger supports optional flamMs", () => {
    const trigger: DrumTrigger = {
      instrumentId: "cp",
      time: 1.0,
      velocity: 1.0,
      flamMs: 15,
    };
    expect(trigger.flamMs).toBe(15);
  });

  it("DrumKit type has trigger, setParam, connectToMixer, dispose", () => {
    const kit: DrumKit = {
      trigger: () => {},
      setParam: () => {},
      connectToMixer: () => {},
      disconnectFromMixer: () => {},
      dispose: () => {},
    };
    expect(typeof kit.trigger).toBe("function");
    expect(typeof kit.setParam).toBe("function");
    expect(typeof kit.connectToMixer).toBe("function");
    expect(typeof kit.dispose).toBe("function");
  });
});
