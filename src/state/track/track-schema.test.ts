import { describe, it, expect } from "vitest";
import { clipSchema, trackSchema } from "./track-schema";

describe("clipSchema", () => {
  const validClip = {
    type: "audio" as const,
    id: "clip-1",
    trackId: "track-1",
    sourceId: "source-1",
    startTime: 2.5,
    sourceOffset: 0,
    duration: 4.0,
    gain: 1.0,
    fadeIn: 0.01,
    fadeOut: 0.05,
    name: "Kick",
  };

  it("accepts a valid clip", () => {
    const result = clipSchema.safeParse(validClip);
    expect(result.success).toBe(true);
  });

  it("rejects negative startTime", () => {
    const result = clipSchema.safeParse({ ...validClip, startTime: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative sourceOffset", () => {
    const result = clipSchema.safeParse({ ...validClip, sourceOffset: -0.5 });
    expect(result.success).toBe(false);
  });

  it("rejects gain above 2", () => {
    const result = clipSchema.safeParse({ ...validClip, gain: 3 });
    expect(result.success).toBe(false);
  });

  it("rejects negative duration", () => {
    const result = clipSchema.safeParse({ ...validClip, duration: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts zero fadeIn/fadeOut", () => {
    const result = clipSchema.safeParse({
      ...validClip,
      fadeIn: 0,
      fadeOut: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("trackSchema", () => {
  const validTrack = {
    id: "track-1",
    name: "Track 1",
    type: "audio" as const,
    color: "#ff2d6f",
    muted: false,
    solo: false,
    armed: false,
    soloIsolate: false,
    volume: 1.0,
    pan: 0,
    clipIds: ["clip-1", "clip-2"],
  };

  it("accepts a valid audio track", () => {
    const result = trackSchema.safeParse(validTrack);
    expect(result.success).toBe(true);
  });

  it("accepts a valid instrument track", () => {
    const result = trackSchema.safeParse({ ...validTrack, type: "instrument" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown track type", () => {
    const result = trackSchema.safeParse({ ...validTrack, type: "midi" });
    expect(result.success).toBe(false);
  });

  it("rejects volume above 2", () => {
    const result = trackSchema.safeParse({ ...validTrack, volume: 2.5 });
    expect(result.success).toBe(false);
  });

  it("rejects pan outside -1..1", () => {
    expect(trackSchema.safeParse({ ...validTrack, pan: -1.5 }).success).toBe(
      false,
    );
    expect(trackSchema.safeParse({ ...validTrack, pan: 1.5 }).success).toBe(
      false,
    );
  });

  it("accepts empty clipIds", () => {
    const result = trackSchema.safeParse({ ...validTrack, clipIds: [] });
    expect(result.success).toBe(true);
  });
});
