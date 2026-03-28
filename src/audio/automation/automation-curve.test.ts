import { describe, it, expect } from "vitest";
import {
  evaluateCurve,
  denormalize,
  normalize,
  insertPoint,
  removePoint,
  movePoint,
} from "./automation-curve";
import type { AutomationPoint } from "./automation-types";

function pt(
  time: number,
  value: number,
  interpolation: "linear" | "curved" = "linear",
  curve = 0,
): AutomationPoint {
  return { id: `p-${String(time)}`, time, value, interpolation, curve };
}

describe("evaluateCurve", () => {
  it("returns 0 for empty points array", () => {
    expect(evaluateCurve([], 5)).toBe(0);
  });

  it("returns single point value regardless of time", () => {
    const points = [pt(2, 0.5)];
    expect(evaluateCurve(points, 0)).toBe(0.5);
    expect(evaluateCurve(points, 2)).toBe(0.5);
    expect(evaluateCurve(points, 10)).toBe(0.5);
  });

  it("holds first point value before first point time", () => {
    const points = [pt(1, 0.3), pt(5, 0.8)];
    expect(evaluateCurve(points, 0)).toBe(0.3);
    expect(evaluateCurve(points, 0.5)).toBe(0.3);
  });

  it("holds last point value after last point time", () => {
    const points = [pt(1, 0.3), pt(5, 0.8)];
    expect(evaluateCurve(points, 5)).toBe(0.8);
    expect(evaluateCurve(points, 100)).toBe(0.8);
  });

  it("linearly interpolates between two points", () => {
    const points = [pt(0, 0, "linear"), pt(10, 1, "linear")];
    expect(evaluateCurve(points, 0)).toBeCloseTo(0, 5);
    expect(evaluateCurve(points, 5)).toBeCloseTo(0.5, 5);
    expect(evaluateCurve(points, 10)).toBeCloseTo(1, 5);
  });

  it("interpolates across multiple segments", () => {
    const points = [
      pt(0, 0, "linear"),
      pt(4, 1, "linear"),
      pt(8, 0.5, "linear"),
    ];
    expect(evaluateCurve(points, 2)).toBeCloseTo(0.5, 5);
    expect(evaluateCurve(points, 4)).toBeCloseTo(1, 5);
    expect(evaluateCurve(points, 6)).toBeCloseTo(0.75, 5);
  });

  it("applies curved interpolation with positive curve", () => {
    const points = [pt(0, 0, "curved", 0.8), pt(10, 1)];
    const mid = evaluateCurve(points, 5);
    // Positive curve = convex (value > linear midpoint 0.5)
    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(1);
  });

  it("applies curved interpolation with negative curve", () => {
    const points = [pt(0, 0, "curved", -0.8), pt(10, 1)];
    const mid = evaluateCurve(points, 5);
    // Negative curve = concave (value < linear midpoint 0.5)
    expect(mid).toBeLessThan(0.5);
    expect(mid).toBeGreaterThan(0);
  });

  it("curve=0 degrades to linear interpolation", () => {
    const points = [pt(0, 0, "curved", 0), pt(10, 1)];
    expect(evaluateCurve(points, 5)).toBeCloseTo(0.5, 5);
  });

  it("handles points at the exact same time as query", () => {
    const points = [pt(0, 0), pt(5, 1), pt(10, 0.5)];
    expect(evaluateCurve(points, 5)).toBeCloseTo(1, 5);
  });
});

describe("denormalize", () => {
  it("maps 0..1 to min..max range", () => {
    expect(denormalize(0, { min: 0, max: 100 })).toBe(0);
    expect(denormalize(0.5, { min: 0, max: 100 })).toBe(50);
    expect(denormalize(1, { min: 0, max: 100 })).toBe(100);
  });

  it("works with negative ranges", () => {
    expect(denormalize(0, { min: -1, max: 1 })).toBe(-1);
    expect(denormalize(0.5, { min: -1, max: 1 })).toBe(0);
    expect(denormalize(1, { min: -1, max: 1 })).toBe(1);
  });
});

describe("normalize", () => {
  it("maps actual value to 0..1", () => {
    expect(normalize(50, { min: 0, max: 100 })).toBe(0.5);
    expect(normalize(0, { min: 0, max: 100 })).toBe(0);
    expect(normalize(100, { min: 0, max: 100 })).toBe(1);
  });

  it("clamps to 0..1", () => {
    expect(normalize(-10, { min: 0, max: 100 })).toBe(0);
    expect(normalize(200, { min: 0, max: 100 })).toBe(1);
  });
});

describe("insertPoint", () => {
  it("inserts into empty array", () => {
    const result = insertPoint([], pt(5, 0.5));
    expect(result).toHaveLength(1);
    expect(result[0]?.time).toBe(5);
  });

  it("maintains time-sorted order", () => {
    const points = [pt(1, 0.1), pt(5, 0.5), pt(10, 1)];
    const result = insertPoint(points, pt(3, 0.3));
    expect(result.map((p) => p.time)).toEqual([1, 3, 5, 10]);
  });

  it("inserts at beginning", () => {
    const points = [pt(5, 0.5)];
    const result = insertPoint(points, pt(1, 0.1));
    expect(result[0]?.time).toBe(1);
  });

  it("inserts at end", () => {
    const points = [pt(5, 0.5)];
    const result = insertPoint(points, pt(10, 1));
    expect(result[1]?.time).toBe(10);
  });
});

describe("removePoint", () => {
  it("removes point by id", () => {
    const points = [pt(1, 0.1), pt(5, 0.5), pt(10, 1)];
    const result = removePoint(points, "p-5");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.time)).toEqual([1, 10]);
  });

  it("returns unchanged array if id not found", () => {
    const points = [pt(1, 0.1)];
    const result = removePoint(points, "nonexistent");
    expect(result).toEqual(points);
  });
});

describe("movePoint", () => {
  it("updates time and value and re-sorts", () => {
    const points = [pt(1, 0.1), pt(5, 0.5), pt(10, 1)];
    const result = movePoint(points, "p-5", 8, 0.8);
    expect(result.map((p) => p.time)).toEqual([1, 8, 10]);
    const moved = result.find((p) => p.id === "p-5");
    expect(moved?.value).toBe(0.8);
    expect(moved?.time).toBe(8);
  });

  it("preserves interpolation and curve when moving", () => {
    const points = [pt(0, 0, "curved", 0.5), pt(10, 1)];
    const result = movePoint(points, "p-0", 2, 0.2);
    const moved = result.find((p) => p.id === "p-0");
    expect(moved?.interpolation).toBe("curved");
    expect(moved?.curve).toBe(0.5);
  });
});
