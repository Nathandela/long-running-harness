import { describe, it, expect } from "vitest";
import {
  sessionSchema,
  transportSectionSchema,
  metaSectionSchema,
  createDefaultSession,
  SESSION_VERSION,
} from "./session-schema";

describe("SessionSchema", () => {
  it("parses a valid session", () => {
    const session = createDefaultSession();
    const result = sessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it("rejects missing version", () => {
    const { version, ...noVersion } = createDefaultSession();
    void version; // ensure version is excluded
    const result = sessionSchema.safeParse(noVersion);
    expect(result.success).toBe(false);
  });

  it("has SESSION_VERSION equal to 1", () => {
    expect(SESSION_VERSION).toBe(1);
  });

  it("createDefaultSession has correct version", () => {
    const session = createDefaultSession();
    expect(session.version).toBe(SESSION_VERSION);
  });

  it("createDefaultSession has valid defaults", () => {
    const session = createDefaultSession();
    expect(session.meta.name).toBe("Untitled");
    expect(session.transport.bpm).toBe(120);
    expect(session.transport.loopEnabled).toBe(false);
    expect(session.tracks).toEqual([]);
    expect(session.mixer.masterVolume).toBe(1);
  });

  it("strips unknown keys", () => {
    const session = { ...createDefaultSession(), unknownField: "test" };
    const result = sessionSchema.safeParse(session);
    expect(result.success).toBe(true);
    if (result.success) {
      expect("unknownField" in result.data).toBe(false);
    }
  });
});

describe("Section-level parsing", () => {
  it("parses transport section independently", () => {
    const result = transportSectionSchema.safeParse({
      bpm: 140,
      loopEnabled: true,
      loopStart: 1.0,
      loopEnd: 4.0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid transport section", () => {
    const result = transportSectionSchema.safeParse({ bpm: "not-a-number" });
    expect(result.success).toBe(false);
  });

  it("parses meta section independently", () => {
    const result = metaSectionSchema.safeParse({
      name: "My Song",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });
});
