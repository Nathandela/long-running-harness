import { describe, it, expect } from "vitest";
import { tokens } from "./tokens";

describe("tokens", () => {
  it("has all accent colors as valid hex strings", () => {
    const hexPattern = /^#[0-9a-f]{6}$/;
    for (const value of Object.values(tokens.color)) {
      expect(value).toMatch(hexPattern);
    }
  });

  it("has the required accent palette", () => {
    expect(tokens.color.black).toBe("#000000");
    expect(tokens.color.white).toBe("#ffffff");
    expect(tokens.color.blue).toBeDefined();
    expect(tokens.color.pink).toBeDefined();
    expect(tokens.color.green).toBeDefined();
    expect(tokens.color.amber).toBeDefined();
    expect(tokens.color.red).toBeDefined();
  });

  it("has spacing values as multiples of 4", () => {
    for (const value of Object.values(tokens.space)) {
      expect(value % 4).toBe(0);
    }
  });

  it("has both font families", () => {
    expect(tokens.font.mono).toContain("JetBrains Mono");
    expect(tokens.font.sans).toContain("system-ui");
  });

  it("has typography scale", () => {
    expect(tokens.text.xs).toBe(10);
    expect(tokens.text.sm).toBe(12);
    expect(tokens.text.base).toBe(14);
  });

  it("has border width", () => {
    expect(tokens.border.width).toBe(2);
  });
});
