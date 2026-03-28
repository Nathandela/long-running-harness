/**
 * Automation scheduler for sample-accurate AudioParam playback.
 * Evaluates automation curves within scheduling windows and applies
 * values to AudioParams via setValueAtTime / linearRampToValueAtTime.
 *
 * Designed to be called from the look-ahead scheduler's tick callback.
 */

import type { AutomationLane, ParameterRange } from "./automation-types";
import { evaluateCurve, denormalize } from "./automation-curve";

/** Resolved parameter binding: the AudioParam to automate and its value range */
export type ResolvedParam = {
  /** The AudioParam or AudioParam-like object to schedule on */
  param: {
    value: number;
    setValueAtTime(value: number, time: number): void;
    linearRampToValueAtTime(value: number, time: number): void;
    cancelScheduledValues(startTime: number): void;
  };
  /** Parameter range for denormalization */
  range: ParameterRange;
};

/**
 * Resolver function: given a lane's trackId and target,
 * returns the AudioParam and its range, or undefined if unresolvable.
 */
export type ParamResolver = (lane: AutomationLane) => ResolvedParam | undefined;

/** Number of intermediate scheduling points per scheduling window */
const SCHEDULE_STEPS = 4;

export type AutomationScheduler = {
  /**
   * Schedule automation values for all lanes within a time window.
   * @param lanes - Active automation lanes to schedule
   * @param windowStart - Start of window in AudioContext time
   * @param windowEnd - End of window in AudioContext time
   * @param timeOffset - Offset: audioCtxTime = arrangementTime + timeOffset
   */
  scheduleWindow(
    lanes: readonly AutomationLane[],
    windowStart: number,
    windowEnd: number,
    timeOffset: number,
  ): void;

  /** Cancel all scheduled automation values */
  cancelAll(): void;
};

export function createAutomationScheduler(
  resolveParam: ParamResolver,
): AutomationScheduler {
  // Track params that have been scheduled for cancelAll
  const scheduledParams = new Set<ResolvedParam["param"]>();

  return {
    scheduleWindow(lanes, windowStart, windowEnd, timeOffset) {
      for (const lane of lanes) {
        // Only schedule in read/touch mode when armed
        if (!lane.armed) continue;
        if (lane.mode === "write") continue;
        if (lane.points.length === 0) continue;

        const resolved = resolveParam(lane);
        if (!resolved) continue;

        const { param, range } = resolved;
        scheduledParams.add(param);

        // Convert window to arrangement time
        const arrStart = windowStart - timeOffset;
        const arrEnd = windowEnd - timeOffset;

        // Cancel any previously scheduled values in this window
        param.cancelScheduledValues(windowStart);

        // Schedule start value
        const startNorm = evaluateCurve(lane.points, arrStart);
        const startVal = denormalize(startNorm, range);
        param.setValueAtTime(startVal, windowStart);

        // Schedule intermediate + end values using linearRamp
        const stepSize = (arrEnd - arrStart) / SCHEDULE_STEPS;
        for (let i = 1; i <= SCHEDULE_STEPS; i++) {
          const arrTime = arrStart + stepSize * i;
          const ctxTime = windowStart + stepSize * i;
          const norm = evaluateCurve(lane.points, arrTime);
          const val = denormalize(norm, range);
          param.linearRampToValueAtTime(val, ctxTime);
        }
      }
    },

    cancelAll() {
      for (const param of scheduledParams) {
        param.cancelScheduledValues(0);
      }
      scheduledParams.clear();
    },
  };
}
