/**
 * Pure functions for automation curve evaluation and point manipulation.
 * All operations are immutable - they return new arrays.
 */

import type { AutomationPoint, ParameterRange } from "./automation-types";

/**
 * Evaluate an automation curve at a given time position.
 * Returns normalized value (0..1).
 *
 * - Before first point: holds first point value
 * - After last point: holds last point value
 * - Between points: interpolates based on left point's interpolation mode
 */
export function evaluateCurve(
  points: readonly AutomationPoint[],
  time: number,
): number {
  const first = points[0];
  if (!first) return 0;
  if (points.length === 1) return first.value;

  // Before first point
  if (time <= first.time) return first.value;

  // After last point
  const last = points[points.length - 1];
  if (!last || time >= last.time) return last?.value ?? 0;

  // Find segment: binary search for left point
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    const midPoint = points[mid];
    if (midPoint && midPoint.time <= time) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const left = points[lo];
  const right = points[hi];
  if (!left || !right) return 0;

  // Compute parameter t within segment
  const dt = right.time - left.time;
  if (dt === 0) return left.value;
  const t = (time - left.time) / dt;

  if (left.interpolation === "linear" || left.curve === 0) {
    return left.value + (right.value - left.value) * t;
  }

  // Curved interpolation: exponential-style curve using power function
  // curve > 0 = convex (fast start), curve < 0 = concave (slow start)
  const shapedT = shapeCurve(t, left.curve);
  return left.value + (right.value - left.value) * shapedT;
}

/**
 * Shape a linear t (0..1) using a curve parameter (-1..1).
 * Positive curve = convex (fast start, slow end).
 * Negative curve = concave (slow start, fast end).
 * Zero = linear.
 */
function shapeCurve(t: number, curve: number): number {
  if (curve === 0) return t;
  // Map curve (-1..1) to exponent: curve=-1 -> exp=3, curve=0 -> exp=1, curve=1 -> exp=1/3
  const exponent = Math.pow(3, -curve);
  return Math.pow(t, exponent);
}

/** Map normalized value (0..1) to actual parameter range, clamped */
export function denormalize(normalized: number, range: ParameterRange): number {
  const val = range.min + normalized * (range.max - range.min);
  return Math.max(range.min, Math.min(range.max, val));
}

/** Map actual parameter value to normalized (0..1), clamped */
export function normalize(value: number, range: ParameterRange): number {
  const span = range.max - range.min;
  if (span === 0) return 0;
  return Math.max(0, Math.min(1, (value - range.min) / span));
}

/** Insert a point maintaining time-sorted order (immutable) */
export function insertPoint(
  points: readonly AutomationPoint[],
  point: AutomationPoint,
): readonly AutomationPoint[] {
  const idx = points.findIndex((p) => p.time > point.time);
  if (idx === -1) return [...points, point];
  return [...points.slice(0, idx), point, ...points.slice(idx)];
}

/** Remove a point by id (immutable) */
export function removePoint(
  points: readonly AutomationPoint[],
  pointId: string,
): readonly AutomationPoint[] {
  const filtered = points.filter((p) => p.id !== pointId);
  return filtered.length === points.length ? points : filtered;
}

/** Move a point to new time/value, re-sorting by time (immutable) */
export function movePoint(
  points: readonly AutomationPoint[],
  pointId: string,
  newTime: number,
  newValue: number,
): readonly AutomationPoint[] {
  const idx = points.findIndex((p) => p.id === pointId);
  if (idx === -1) return points;
  const existing = points[idx];
  if (!existing) return points;
  const updated: AutomationPoint = {
    ...existing,
    time: newTime,
    value: newValue,
  };
  const without = [...points.slice(0, idx), ...points.slice(idx + 1)];
  return insertPoint(without, updated);
}
