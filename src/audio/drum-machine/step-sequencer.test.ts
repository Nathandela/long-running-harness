import { describe, it, expect, beforeEach } from "vitest";
import { createStepSequencer } from "./step-sequencer";
import type { DrumTrigger } from "./drum-types";

describe("createStepSequencer", () => {
  let triggers: DrumTrigger[];
  let onTrigger: (t: DrumTrigger) => void;

  beforeEach(() => {
    triggers = [];
    onTrigger = (t): void => {
      triggers.push(t);
    };
  });

  it("creates a sequencer with two pattern slots (A/B)", () => {
    const seq = createStepSequencer(onTrigger);
    expect(seq.getActivePatternName()).toBe("A");
  });

  it("advances step and fires triggers for active instruments", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("bd", 0);

    seq.scheduleStep(0, 0.5);
    expect(triggers).toHaveLength(1);
    const t = triggers[0];
    expect(t).toBeDefined();
    expect(t?.instrumentId).toBe("bd");
    expect(t?.time).toBe(0.5);
    expect(t?.velocity).toBeCloseTo(0.8);
  });

  it("does not fire triggers for inactive steps", () => {
    const seq = createStepSequencer(onTrigger);
    seq.scheduleStep(0, 0.5);
    expect(triggers).toHaveLength(0);
  });

  it("accent boosts velocity", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("sd", 3);
    seq.setAccent(3, true);

    seq.scheduleStep(3, 1.0);
    expect(triggers).toHaveLength(1);
    expect(triggers[0]?.velocity).toBe(1.0);
  });

  it("flam passes flamMs to trigger", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("cp", 5);
    seq.setFlam(5, 20);

    seq.scheduleStep(5, 2.0);
    expect(triggers[0]?.flamMs).toBe(20);
  });

  it("toggleStep toggles on and off", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("bd", 0);
    seq.scheduleStep(0, 0);
    expect(triggers).toHaveLength(1);

    triggers.length = 0;
    seq.toggleStep("bd", 0);
    seq.scheduleStep(0, 0);
    expect(triggers).toHaveLength(0);
  });

  it("supports multiple instruments on the same step", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("bd", 0);
    seq.toggleStep("ch", 0);

    seq.scheduleStep(0, 0);
    expect(triggers).toHaveLength(2);
    const ids = triggers.map((t) => t.instrumentId);
    expect(ids).toContain("bd");
    expect(ids).toContain("ch");
  });

  it("pattern A/B switching", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("bd", 0);

    seq.switchPattern("B");
    expect(seq.getActivePatternName()).toBe("B");

    seq.scheduleStep(0, 0);
    expect(triggers).toHaveLength(0);

    seq.toggleStep("sd", 0);

    seq.switchPattern("A");
    triggers.length = 0;
    seq.scheduleStep(0, 0);
    expect(triggers).toHaveLength(1);
    expect(triggers[0]?.instrumentId).toBe("bd");
  });

  it("getPattern returns current pattern state", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("bd", 0);
    seq.setAccent(0, true);

    const pattern = seq.getPattern();
    expect(pattern.steps[0]?.triggers.bd).toBe(true);
    expect(pattern.steps[0]?.accent).toBe(true);
  });

  it("clearPattern resets all steps", () => {
    const seq = createStepSequencer(onTrigger);
    seq.toggleStep("bd", 0);
    seq.toggleStep("sd", 4);
    seq.clearPattern();

    seq.scheduleStep(0, 0);
    seq.scheduleStep(4, 0.5);
    expect(triggers).toHaveLength(0);
  });
});
