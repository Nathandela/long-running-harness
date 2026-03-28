import { describe, it, expect } from "vitest";
import {
  ARP_PATTERNS,
  ARP_DIRECTIONS,
  ARP_RATE_DIVISIONS,
  DEFAULT_ARP_PARAMS,
  createDefaultArpParams,
  rateDivisionToBeats,
  type ArpNoteEvent,
} from "./arpeggiator-types";

describe("arpeggiator-types", () => {
  it("defines all six pattern modes", () => {
    expect(ARP_PATTERNS).toEqual([
      "up",
      "down",
      "up-down",
      "down-up",
      "random",
      "as-played",
    ]);
  });

  it("defines octave directions", () => {
    expect(ARP_DIRECTIONS).toEqual(["up", "down", "up-down"]);
  });

  it("defines rate divisions including triplets", () => {
    expect(ARP_RATE_DIVISIONS).toContain("1/4");
    expect(ARP_RATE_DIVISIONS).toContain("1/8");
    expect(ARP_RATE_DIVISIONS).toContain("1/16");
    expect(ARP_RATE_DIVISIONS).toContain("1/32");
    expect(ARP_RATE_DIVISIONS).toContain("1/4t");
    expect(ARP_RATE_DIVISIONS).toContain("1/8t");
    expect(ARP_RATE_DIVISIONS).toContain("1/16t");
    expect(ARP_RATE_DIVISIONS).toContain("1/32t");
  });

  it("provides sensible defaults", () => {
    const params = DEFAULT_ARP_PARAMS;
    expect(params.enabled).toBe(false);
    expect(params.pattern).toBe("up");
    expect(params.rateDivision).toBe("1/8");
    expect(params.octaveRange).toBe(1);
    expect(params.octaveDirection).toBe("up");
    expect(params.gate).toBeGreaterThan(0);
    expect(params.gate).toBeLessThanOrEqual(1);
    expect(params.swing).toBe(0);
    expect(params.latch).toBe(false);
  });

  it("createDefaultArpParams returns a fresh copy each time", () => {
    const a = createDefaultArpParams();
    const b = createDefaultArpParams();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it("ArpParams octaveRange clamped to 1-4", () => {
    const params = createDefaultArpParams();
    expect(params.octaveRange).toBeGreaterThanOrEqual(1);
    expect(params.octaveRange).toBeLessThanOrEqual(4);
  });

  it("ArpNoteEvent type has required fields", () => {
    // Type-level test: verify the shape compiles
    const event: ArpNoteEvent = {
      note: 60,
      velocity: 100,
      startTime: 0.5,
      duration: 0.1,
    };
    expect(event.note).toBe(60);
    expect(event.velocity).toBe(100);
    expect(event.startTime).toBe(0.5);
    expect(event.duration).toBe(0.1);
  });

  it("rateDivisionToBeats converts divisions correctly", () => {
    expect(rateDivisionToBeats("1/4")).toBe(1);
    expect(rateDivisionToBeats("1/8")).toBe(0.5);
    expect(rateDivisionToBeats("1/16")).toBe(0.25);
    expect(rateDivisionToBeats("1/32")).toBe(0.125);
    // Triplets: 2/3 of the straight value
    expect(rateDivisionToBeats("1/4t")).toBeCloseTo(2 / 3);
    expect(rateDivisionToBeats("1/8t")).toBeCloseTo(1 / 3);
  });
});
