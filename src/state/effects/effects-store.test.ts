import { describe, it, expect, beforeEach } from "vitest";
import { useEffectsStore } from "./effects-store";

describe("EffectsStore", () => {
  beforeEach(() => {
    useEffectsStore.setState({ trackEffects: {} });
  });

  it("starts with empty track effects", () => {
    const state = useEffectsStore.getState();
    expect(state.trackEffects).toEqual({});
  });

  it("adds an effect to a track", () => {
    const { addEffect } = useEffectsStore.getState();
    addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: { decay: 2, mix: 30 },
    });

    const slots = useEffectsStore.getState().trackEffects["track-1"];
    expect(slots).toHaveLength(1);
    expect(slots?.[0]?.typeId).toBe("reverb");
  });

  it("adds multiple effects to same track in order", () => {
    const { addEffect } = useEffectsStore.getState();
    addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: {},
    });
    addEffect("track-1", {
      id: "fx-2",
      typeId: "delay",
      bypassed: false,
      params: {},
    });

    const slots = useEffectsStore.getState().trackEffects["track-1"];
    expect(slots).toHaveLength(2);
    expect(slots?.[0]?.typeId).toBe("reverb");
    expect(slots?.[1]?.typeId).toBe("delay");
  });

  it("removes an effect from a track", () => {
    const { addEffect, removeEffect } = useEffectsStore.getState();
    addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: {},
    });
    addEffect("track-1", {
      id: "fx-2",
      typeId: "delay",
      bypassed: false,
      params: {},
    });

    removeEffect("track-1", "fx-1");

    const slots = useEffectsStore.getState().trackEffects["track-1"];
    expect(slots).toHaveLength(1);
    expect(slots?.[0]?.id).toBe("fx-2");
  });

  it("updates effect params", () => {
    const { addEffect, updateEffectParam } = useEffectsStore.getState();
    addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: { decay: 2 },
    });

    updateEffectParam("track-1", "fx-1", "decay", 5);

    const slot = useEffectsStore.getState().trackEffects["track-1"]?.[0];
    expect(slot?.params["decay"]).toBe(5);
  });

  it("toggles effect bypass", () => {
    const { addEffect, toggleBypass } = useEffectsStore.getState();
    addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: {},
    });

    toggleBypass("track-1", "fx-1");
    expect(
      useEffectsStore.getState().trackEffects["track-1"]?.[0]?.bypassed,
    ).toBe(true);

    toggleBypass("track-1", "fx-1");
    expect(
      useEffectsStore.getState().trackEffects["track-1"]?.[0]?.bypassed,
    ).toBe(false);
  });

  it("removes all effects for a track", () => {
    const { addEffect, removeTrackEffects } = useEffectsStore.getState();
    addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: {},
    });
    addEffect("track-1", {
      id: "fx-2",
      typeId: "delay",
      bypassed: false,
      params: {},
    });

    removeTrackEffects("track-1");
    expect(useEffectsStore.getState().trackEffects["track-1"]).toBeUndefined();
  });

  it("getTrackEffects returns empty array for unknown track", () => {
    const { getTrackEffects } = useEffectsStore.getState();
    expect(getTrackEffects("nonexistent")).toEqual([]);
  });

  it("reorders effects within a track", () => {
    const { addEffect, reorderEffect } = useEffectsStore.getState();
    addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: {},
    });
    addEffect("track-1", {
      id: "fx-2",
      typeId: "delay",
      bypassed: false,
      params: {},
    });
    addEffect("track-1", {
      id: "fx-3",
      typeId: "compressor",
      bypassed: false,
      params: {},
    });

    reorderEffect("track-1", "fx-3", 0);

    const slots = useEffectsStore.getState().trackEffects["track-1"];
    expect(slots?.[0]?.id).toBe("fx-3");
    expect(slots?.[1]?.id).toBe("fx-1");
    expect(slots?.[2]?.id).toBe("fx-2");
  });
});
