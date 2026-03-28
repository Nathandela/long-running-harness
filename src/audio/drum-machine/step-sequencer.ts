/**
 * 16-step pattern sequencer for the TR-808 drum machine.
 * Manages pattern state (A/B), step toggles, accent, flam.
 * Emits DrumTrigger events on scheduleStep() calls from the scheduler.
 *
 * R-STA-06: Synchronized to transport via external scheduler callback.
 */

import {
  createEmptyPattern,
  DRUM_INSTRUMENTS,
  type DrumInstrumentId,
  type DrumStep,
  type DrumPattern,
  type DrumTrigger,
} from "./drum-types";

const NORMAL_VELOCITY = 0.8;
const ACCENT_VELOCITY = 1.0;
const STEPS_PER_PATTERN = 16;

export type StepSequencer = {
  /** Schedule all triggers for a given step at the given audio time */
  scheduleStep(stepIndex: number, time: number): void;
  /** Toggle an instrument on/off at a step */
  toggleStep(instrumentId: DrumInstrumentId, stepIndex: number): void;
  /** Set accent for a step */
  setAccent(stepIndex: number, accent: boolean): void;
  /** Set flam timing for a step (ms) */
  setFlam(stepIndex: number, flamMs: number): void;
  /** Switch active pattern */
  switchPattern(name: string): void;
  /** Get active pattern name */
  getActivePatternName(): string;
  /** Get a snapshot of the current pattern */
  getPattern(): DrumPattern;
  /** Clear all steps in the active pattern */
  clearPattern(): void;
};

export function createStepSequencer(
  onTrigger: (trigger: DrumTrigger) => void,
): StepSequencer {
  const patterns = new Map<string, DrumStep[]>();
  let activePatternName = "A";

  // Initialize A and B
  patterns.set("A", createSteps());
  patterns.set("B", createSteps());

  function createSteps(): DrumStep[] {
    return createEmptyPattern().steps.map((s) => ({
      ...s,
      triggers: { ...s.triggers },
    }));
  }

  function getActiveSteps(): DrumStep[] {
    let steps = patterns.get(activePatternName);
    if (!steps) {
      steps = createSteps();
      patterns.set(activePatternName, steps);
    }
    return steps;
  }

  const seq: StepSequencer = {
    scheduleStep(stepIndex: number, time: number): void {
      const idx = stepIndex % STEPS_PER_PATTERN;
      const steps = getActiveSteps();
      const step = steps[idx];
      if (!step) return;
      const velocity = step.accent ? ACCENT_VELOCITY : NORMAL_VELOCITY;

      for (const inst of DRUM_INSTRUMENTS) {
        if (step.triggers[inst.id]) {
          onTrigger({
            instrumentId: inst.id,
            time,
            velocity,
            flamMs: step.flamMs > 0 ? step.flamMs : undefined,
          });
        }
      }
    },

    toggleStep(instrumentId: DrumInstrumentId, stepIndex: number): void {
      const steps = getActiveSteps();
      const idx = stepIndex % STEPS_PER_PATTERN;
      const step = steps[idx];
      if (!step) return;
      const newTriggers = { ...step.triggers };
      newTriggers[instrumentId] = !newTriggers[instrumentId];
      steps[idx] = { ...step, triggers: newTriggers };
    },

    setAccent(stepIndex: number, accent: boolean): void {
      const steps = getActiveSteps();
      const idx = stepIndex % STEPS_PER_PATTERN;
      const step = steps[idx];
      if (!step) return;
      steps[idx] = { ...step, accent };
    },

    setFlam(stepIndex: number, flamMs: number): void {
      const steps = getActiveSteps();
      const idx = stepIndex % STEPS_PER_PATTERN;
      const step = steps[idx];
      if (!step) return;
      steps[idx] = { ...step, flamMs };
    },

    switchPattern(name: string): void {
      if (!patterns.has(name)) {
        patterns.set(name, createSteps());
      }
      activePatternName = name;
    },

    getActivePatternName(): string {
      return activePatternName;
    },

    getPattern(): DrumPattern {
      const steps = getActiveSteps();
      return {
        name: activePatternName,
        steps: steps.map((s) => ({ ...s, triggers: { ...s.triggers } })),
      };
    },

    clearPattern(): void {
      patterns.set(activePatternName, createSteps());
    },
  };

  return seq;
}
