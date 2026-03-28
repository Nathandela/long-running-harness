import { describe, it, expect } from "vitest";
import {
  arpParamsSchema,
  trackArpSchema,
  arpeggiatorSectionSchema,
} from "./arpeggiator-schema";
import { DEFAULT_ARP_PARAMS } from "@audio/arpeggiator/arpeggiator-types";

describe("arpeggiator-schema", () => {
  it("validates default params", () => {
    const result = arpParamsSchema.safeParse(DEFAULT_ARP_PARAMS);
    expect(result.success).toBe(true);
  });

  it("rejects invalid pattern", () => {
    const result = arpParamsSchema.safeParse({
      ...DEFAULT_ARP_PARAMS,
      pattern: "zigzag",
    });
    expect(result.success).toBe(false);
  });

  it("rejects octaveRange out of 1-4", () => {
    expect(
      arpParamsSchema.safeParse({ ...DEFAULT_ARP_PARAMS, octaveRange: 0 })
        .success,
    ).toBe(false);
    expect(
      arpParamsSchema.safeParse({ ...DEFAULT_ARP_PARAMS, octaveRange: 5 })
        .success,
    ).toBe(false);
  });

  it("rejects gate out of 0.01-1", () => {
    expect(
      arpParamsSchema.safeParse({ ...DEFAULT_ARP_PARAMS, gate: 0 }).success,
    ).toBe(false);
    expect(
      arpParamsSchema.safeParse({ ...DEFAULT_ARP_PARAMS, gate: 1.5 }).success,
    ).toBe(false);
  });

  it("validates trackArpSchema", () => {
    const result = trackArpSchema.safeParse({
      trackId: "t-1",
      params: DEFAULT_ARP_PARAMS,
    });
    expect(result.success).toBe(true);
  });

  it("validates arpeggiatorSectionSchema (array)", () => {
    const result = arpeggiatorSectionSchema.safeParse([
      { trackId: "t-1", params: DEFAULT_ARP_PARAMS },
      { trackId: "t-2", params: { ...DEFAULT_ARP_PARAMS, pattern: "random" } },
    ]);
    expect(result.success).toBe(true);
  });

  it("validates empty array", () => {
    const result = arpeggiatorSectionSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("validates all rate divisions", () => {
    const divisions = [
      "1/4",
      "1/8",
      "1/16",
      "1/32",
      "1/4t",
      "1/8t",
      "1/16t",
      "1/32t",
    ];
    for (const d of divisions) {
      const result = arpParamsSchema.safeParse({
        ...DEFAULT_ARP_PARAMS,
        rateDivision: d,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid rate division", () => {
    const result = arpParamsSchema.safeParse({
      ...DEFAULT_ARP_PARAMS,
      rateDivision: "1/6",
    });
    expect(result.success).toBe(false);
  });
});
