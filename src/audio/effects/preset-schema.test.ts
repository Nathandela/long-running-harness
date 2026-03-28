import { describe, it, expect } from "vitest";
import { effectPresetSchema, validatePreset } from "./preset-schema";

describe("effectPresetSchema", () => {
  it("validates a correct preset", () => {
    const preset = {
      typeId: "reverb",
      name: "Large Hall",
      params: { decay: 3.5, mix: 0.7 },
    };
    const result = effectPresetSchema.safeParse(preset);
    expect(result.success).toBe(true);
  });

  it("rejects preset with missing typeId", () => {
    const preset = { name: "Bad", params: {} };
    const result = effectPresetSchema.safeParse(preset);
    expect(result.success).toBe(false);
  });

  it("rejects preset with missing name", () => {
    const preset = { typeId: "reverb", params: {} };
    const result = effectPresetSchema.safeParse(preset);
    expect(result.success).toBe(false);
  });

  it("rejects preset with non-numeric param values", () => {
    const preset = {
      typeId: "reverb",
      name: "Bad",
      params: { decay: "not a number" },
    };
    const result = effectPresetSchema.safeParse(preset);
    expect(result.success).toBe(false);
  });

  it("allows empty params", () => {
    const preset = { typeId: "reverb", name: "Default", params: {} };
    const result = effectPresetSchema.safeParse(preset);
    expect(result.success).toBe(true);
  });
});

describe("validatePreset", () => {
  it("returns parsed data for valid preset", () => {
    const preset = {
      typeId: "delay",
      name: "Short Slapback",
      params: { time: 0.1, feedback: 0.3 },
    };
    const result = validatePreset(preset);
    expect(result).toEqual(preset);
  });

  it("throws for invalid preset", () => {
    expect(() => validatePreset({ bad: true })).toThrow();
  });
});
