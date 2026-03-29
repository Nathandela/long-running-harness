/**
 * Regression test: drum cache cleanup on same-size track replacement.
 *
 * When hydrateStore() replaces the entire track array with a different set
 * of the same length, stale cache entries must still be purged.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useDawStore } from "@state/store";
import type { TrackModel } from "@state/track/types";
import { sequencerCache, paramsCache } from "./panels";

function makeTrack(id: string, type: TrackModel["type"] = "drum"): TrackModel {
  return {
    id,
    name: `Track ${id}`,
    type,
    color: "#000",
    muted: false,
    solo: false,
    armed: false,
    soloIsolate: false,
    volume: 1,
    pan: 0,
    outputBus: "master",
  };
}

describe("drum cache cleanup", () => {
  beforeEach(() => {
    sequencerCache.clear();
    paramsCache.clear();
    useDawStore.setState({ tracks: [] });
  });

  it("purges stale entries when tracks are replaced with same-size set", () => {
    // Set up initial tracks and populate caches
    useDawStore.setState({ tracks: [makeTrack("a"), makeTrack("b")] });
    sequencerCache.set("a", {} as never);
    sequencerCache.set("b", {} as never);
    paramsCache.set("a", {} as never);
    paramsCache.set("b", {} as never);

    // Replace with different tracks of the same count
    useDawStore.setState({ tracks: [makeTrack("c"), makeTrack("d")] });

    expect(sequencerCache.has("a")).toBe(false);
    expect(sequencerCache.has("b")).toBe(false);
    expect(paramsCache.has("a")).toBe(false);
    expect(paramsCache.has("b")).toBe(false);
  });

  it("purges only removed entries on partial replacement", () => {
    useDawStore.setState({ tracks: [makeTrack("a"), makeTrack("b")] });
    sequencerCache.set("a", {} as never);
    sequencerCache.set("b", {} as never);

    // Replace one track, keep the other
    useDawStore.setState({ tracks: [makeTrack("a"), makeTrack("c")] });

    expect(sequencerCache.has("a")).toBe(true);
    expect(sequencerCache.has("b")).toBe(false);
  });
});
