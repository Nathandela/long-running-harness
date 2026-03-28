import { describe, it, expect, vi, afterEach } from "vitest";
import { isCrossOriginIsolated } from "./cross-origin-check";

describe("isCrossOriginIsolated", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when crossOriginIsolated is true", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    expect(isCrossOriginIsolated()).toBe(true);
  });

  it("returns false when crossOriginIsolated is false", () => {
    vi.stubGlobal("crossOriginIsolated", false);
    expect(isCrossOriginIsolated()).toBe(false);
  });

  it("returns false when crossOriginIsolated is undefined", () => {
    vi.stubGlobal("crossOriginIsolated", undefined);
    expect(isCrossOriginIsolated()).toBe(false);
  });
});
