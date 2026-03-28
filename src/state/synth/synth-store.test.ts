import { describe, it, expect, beforeEach } from "vitest";
import { useSynthStore } from "./synth-store";
import { DEFAULT_SYNTH_PARAMS } from "@audio/synth/synth-types";

describe("SynthStore", () => {
  beforeEach(() => {
    useSynthStore.setState({ synths: {} });
  });

  it("initializes synth state for a track", () => {
    useSynthStore.getState().initSynth("track-1");
    const synth = useSynthStore.getState().synths["track-1"];
    expect(synth).toBeDefined();
    expect(synth?.trackId).toBe("track-1");
    expect(synth?.params.osc1Type).toBe(DEFAULT_SYNTH_PARAMS.osc1Type);
    expect(synth?.legato).toBe(false);
  });

  it("does not overwrite existing synth state", () => {
    const { initSynth, setParam } = useSynthStore.getState();
    initSynth("track-1");
    setParam("track-1", "filterCutoff", 1000);

    // Re-init should not reset
    initSynth("track-1");
    expect(
      useSynthStore.getState().synths["track-1"]?.params.filterCutoff,
    ).toBe(1000);
  });

  it("removes synth state", () => {
    const { initSynth, removeSynth } = useSynthStore.getState();
    initSynth("track-1");
    removeSynth("track-1");
    expect(useSynthStore.getState().synths["track-1"]).toBeUndefined();
  });

  it("sets a numeric parameter", () => {
    const { initSynth, setParam } = useSynthStore.getState();
    initSynth("track-1");
    setParam("track-1", "filterCutoff", 2000);
    expect(
      useSynthStore.getState().synths["track-1"]?.params.filterCutoff,
    ).toBe(2000);
  });

  it("sets a string parameter (waveform type)", () => {
    const { initSynth, setParam } = useSynthStore.getState();
    initSynth("track-1");
    setParam("track-1", "osc1Type", "square");
    expect(useSynthStore.getState().synths["track-1"]?.params.osc1Type).toBe(
      "square",
    );
  });

  it("toggles legato mode", () => {
    const { initSynth, setLegato } = useSynthStore.getState();
    initSynth("track-1");
    setLegato("track-1", true);
    expect(useSynthStore.getState().synths["track-1"]?.legato).toBe(true);
  });

  it("getParams returns defaults for uninitialized track", () => {
    const params = useSynthStore.getState().getParams("nonexistent");
    expect(params.osc1Type).toBe(DEFAULT_SYNTH_PARAMS.osc1Type);
    expect(params.filterCutoff).toBe(DEFAULT_SYNTH_PARAMS.filterCutoff);
  });

  it("ignores setParam for uninitialized track", () => {
    useSynthStore.getState().setParam("nonexistent", "filterCutoff", 5000);
    expect(useSynthStore.getState().synths["nonexistent"]).toBeUndefined();
  });
});
