import { describe, it, expect } from "vitest";
import { recoverSession } from "./session-recovery";
import { createDefaultSession } from "./session-schema";

describe("recoverSession", () => {
  it("recovers a fully valid session with no warnings", () => {
    const session = createDefaultSession();
    const json = JSON.stringify(session);
    const result = recoverSession(json);
    expect(result.warnings).toEqual([]);
    expect(result.session.version).toBe(session.version);
    expect(result.session.transport.bpm).toBe(120);
  });

  it("returns defaults with warning for invalid JSON", () => {
    const result = recoverSession("not-json{{{");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("JSON");
    expect(result.session.transport.bpm).toBe(120);
  });

  it("recovers valid sections from partially corrupt data", () => {
    const session = createDefaultSession();
    const obj = JSON.parse(JSON.stringify(session)) as Record<string, unknown>;
    // Corrupt transport but keep valid meta
    obj["transport"] = "broken";
    const result = recoverSession(JSON.stringify(obj));
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("transport"))).toBe(true);
    // Meta should be recovered
    expect(result.session.meta.name).toBe("Untitled");
    // Transport should use defaults
    expect(result.session.transport.bpm).toBe(120);
  });

  it("handles completely empty object", () => {
    const result = recoverSession("{}");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.session.version).toBe(1);
    expect(result.session.transport.bpm).toBe(120);
    expect(result.session.meta.name).toBe("Untitled");
  });

  it("recovers when only one section is valid", () => {
    const obj = {
      version: 1,
      meta: "invalid",
      transport: { bpm: 140, loopEnabled: true, loopStart: 1, loopEnd: 4 },
      tracks: "invalid",
      mixer: "invalid",
    };
    const result = recoverSession(JSON.stringify(obj));
    // Transport should be recovered
    expect(result.session.transport.bpm).toBe(140);
    // Others should be defaults
    expect(result.session.meta.name).toBe("Untitled");
    expect(result.session.tracks).toEqual([]);
    expect(result.session.mixer.masterVolume).toBe(1);
  });
});
