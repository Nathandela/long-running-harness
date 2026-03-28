import { describe, it, expect } from "vitest";
import {
  automationPointSchema,
  automationLaneSchema,
  automationSectionSchema,
} from "./automation-schema";

describe("automationPointSchema", () => {
  it("validates a correct point", () => {
    const result = automationPointSchema.safeParse({
      id: "p1",
      time: 5.0,
      value: 0.5,
      interpolation: "linear",
      curve: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects value outside 0..1", () => {
    const result = automationPointSchema.safeParse({
      id: "p1",
      time: 5,
      value: 1.5,
      interpolation: "linear",
      curve: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects curve outside -1..1", () => {
    const result = automationPointSchema.safeParse({
      id: "p1",
      time: 5,
      value: 0.5,
      interpolation: "curved",
      curve: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative time", () => {
    const result = automationPointSchema.safeParse({
      id: "p1",
      time: -1,
      value: 0.5,
      interpolation: "linear",
      curve: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("automationLaneSchema", () => {
  it("validates a lane with mixer target", () => {
    const result = automationLaneSchema.safeParse({
      id: "lane-1",
      trackId: "track-1",
      target: { type: "mixer", param: "volume" },
      points: [],
      mode: "read",
      armed: true,
    });
    expect(result.success).toBe(true);
  });

  it("validates a lane with effect target", () => {
    const result = automationLaneSchema.safeParse({
      id: "lane-2",
      trackId: "track-1",
      target: { type: "effect", effectId: "fx-1", paramKey: "cutoff" },
      points: [
        { id: "p1", time: 0, value: 0, interpolation: "linear", curve: 0 },
        { id: "p2", time: 5, value: 1, interpolation: "curved", curve: 0.5 },
      ],
      mode: "write",
      armed: false,
    });
    expect(result.success).toBe(true);
  });

  it("validates a lane with synth target", () => {
    const result = automationLaneSchema.safeParse({
      id: "lane-3",
      trackId: "track-1",
      target: { type: "synth", paramKey: "filterCutoff" },
      points: [],
      mode: "touch",
      armed: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid mode", () => {
    const result = automationLaneSchema.safeParse({
      id: "lane-1",
      trackId: "track-1",
      target: { type: "mixer", param: "volume" },
      points: [],
      mode: "invalid",
      armed: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("automationSectionSchema", () => {
  it("validates a section with track lanes", () => {
    const result = automationSectionSchema.safeParse([
      {
        trackId: "track-1",
        lanes: [
          {
            id: "lane-1",
            trackId: "track-1",
            target: { type: "mixer", param: "volume" },
            points: [],
            mode: "read",
            armed: true,
          },
        ],
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("validates empty section", () => {
    const result = automationSectionSchema.safeParse([]);
    expect(result.success).toBe(true);
  });
});
