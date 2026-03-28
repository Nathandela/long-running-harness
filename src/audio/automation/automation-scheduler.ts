/**
 * Automation scheduler for sample-accurate AudioParam playback.
 * Evaluates automation curves at exact breakpoints within scheduling windows
 * and applies values to AudioParams via setValueAtTime / linearRampToValueAtTime.
 *
 * Designed to be called from the look-ahead scheduler's advance callback.
 */

import type { AutomationLane, ParameterRange } from "./automation-types";
import {
  evaluateCurve,
  denormalize,
  findPointsInRange,
} from "./automation-curve";

/** Resolved parameter binding: the AudioParam to automate and its value range */
export type ResolvedParam = {
  /** The AudioParam or AudioParam-like object to schedule on */
  param: {
    value: number;
    setValueAtTime(value: number, time: number): void;
    linearRampToValueAtTime(value: number, time: number): void;
    cancelScheduledValues(startTime: number): void;
    cancelAndHoldAtTime?(startTime: number): void;
  };
  /** Parameter range for denormalization */
  range: ParameterRange;
};

/**
 * Resolver function: given a lane's trackId and target,
 * returns the AudioParam and its range, or undefined if unresolvable.
 */
export type ParamResolver = (lane: AutomationLane) => ResolvedParam | undefined;

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
      // Guard: zero-length window has nothing to schedule
      if (windowEnd <= windowStart) return;

      // Rebuild tracked params each window to avoid stale references
      const currentParams = new Set<ResolvedParam["param"]>();

      for (const lane of lanes) {
        // Only schedule in read/touch mode when armed
        if (!lane.armed) continue;
        if (lane.mode === "write") continue;
        if (lane.points.length === 0) continue;

        const resolved = resolveParam(lane);
        if (!resolved) continue;

        const { param, range } = resolved;
        currentParams.add(param);

        // Convert window to arrangement time
        const arrStart = windowStart - timeOffset;
        const arrEnd = windowEnd - timeOffset;

        // Cancel previous scheduling (prefer cancelAndHoldAtTime for glitch-free transitions)
        if (param.cancelAndHoldAtTime) {
          param.cancelAndHoldAtTime(windowStart);
        } else {
          param.cancelScheduledValues(windowStart);
        }

        // Schedule start value
        const startNorm = evaluateCurve(lane.points, arrStart);
        const startVal = denormalize(startNorm, range);
        param.setValueAtTime(startVal, windowStart);

        // Schedule exact breakpoints within the window for sample-accurate playback
        const innerPoints = findPointsInRange(lane.points, arrStart, arrEnd);
        for (const pt of innerPoints) {
          const ctxTime = pt.time + timeOffset;
          const val = denormalize(pt.value, range);
          param.linearRampToValueAtTime(val, ctxTime);
        }

        // Schedule end value
        const endNorm = evaluateCurve(lane.points, arrEnd);
        const endVal = denormalize(endNorm, range);
        param.linearRampToValueAtTime(endVal, windowEnd);
      }

      // Replace tracked params to avoid unbounded growth from stale references
      scheduledParams.clear();
      for (const p of currentParams) scheduledParams.add(p);
    },

    cancelAll() {
      for (const param of scheduledParams) {
        try {
          param.cancelScheduledValues(0);
        } catch {
          // Param may have been disconnected/disposed
        }
      }
      scheduledParams.clear();
    },
  };
}
