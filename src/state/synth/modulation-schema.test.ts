import { describe, it, expect } from "vitest";
import {
  modulationRouteSchema,
  modulationSectionSchema,
} from "./modulation-schema";

describe("Modulation Schema", () => {
  it("parses a valid modulation route", () => {
    const result = modulationRouteSchema.safeParse({
      id: "mod-1",
      source: "lfo1",
      destination: "filterCutoff",
      amount: 0.5,
      bipolar: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid source", () => {
    const result = modulationRouteSchema.safeParse({
      id: "mod-1",
      source: "invalid",
      destination: "filterCutoff",
      amount: 0.5,
      bipolar: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid destination", () => {
    const result = modulationRouteSchema.safeParse({
      id: "mod-1",
      source: "lfo1",
      destination: "invalid",
      amount: 0.5,
      bipolar: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects amount out of range", () => {
    const result = modulationRouteSchema.safeParse({
      id: "mod-1",
      source: "lfo1",
      destination: "filterCutoff",
      amount: 1.5,
      bipolar: true,
    });
    expect(result.success).toBe(false);
  });

  it("parses a valid modulation section", () => {
    const result = modulationSectionSchema.safeParse({
      "track-1": [
        {
          id: "mod-1",
          source: "lfo1",
          destination: "filterCutoff",
          amount: 0.5,
          bipolar: true,
        },
      ],
      "track-2": [],
    });
    expect(result.success).toBe(true);
  });

  it("parses empty modulation section", () => {
    const result = modulationSectionSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
