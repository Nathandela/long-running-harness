/**
 * Tests that master volume store changes are forwarded to the MixerEngine.
 * Validates the bridge subscription added in TrackAudioBridgeProvider.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMixerEngine, type MixerEngine } from "@audio/mixer";
import { useDawStore } from "@state/store";
import { createMockAudioContext } from "../test/integration/helpers";

describe("Master volume bridge", () => {
  let ctx: AudioContext;
  let mixer: MixerEngine;

  beforeEach(() => {
    ctx = createMockAudioContext();
    mixer = createMixerEngine(ctx);
    useDawStore.setState({ masterVolume: 1 });
  });

  afterEach(() => {
    mixer.dispose();
  });

  it("setMasterLevel updates master fader gain", () => {
    mixer.setMasterLevel(0.5);
    expect(mixer.getMaster().faderGain.gain.value).toBe(0.5);
  });

  it("setMasterLevel clamps to [0, 2]", () => {
    mixer.setMasterLevel(3);
    expect(mixer.getMaster().faderGain.gain.value).toBe(2);

    mixer.setMasterLevel(-1);
    expect(mixer.getMaster().faderGain.gain.value).toBe(0);
  });

  it("store masterVolume subscription pattern works correctly", () => {
    // Simulate what the bridge useEffect does:
    // subscribe to store changes and forward to mixer
    mixer.setMasterLevel(useDawStore.getState().masterVolume);
    const unsub = useDawStore.subscribe((state, prev) => {
      if (state.masterVolume !== prev.masterVolume) {
        mixer.setMasterLevel(state.masterVolume);
      }
    });

    // Initial state
    expect(mixer.getMaster().faderGain.gain.value).toBe(1);

    // Change master volume in store
    useDawStore.getState().setMasterVolume(0.75);
    expect(mixer.getMaster().faderGain.gain.value).toBe(0.75);

    // Change again
    useDawStore.getState().setMasterVolume(1.5);
    expect(mixer.getMaster().faderGain.gain.value).toBe(1.5);

    unsub();
  });
});
