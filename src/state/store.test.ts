import { describe, it, expect, beforeEach } from "vitest";
import { useDawStore } from "./store";
import type { TrackModel, AudioClipModel } from "./track/types";

describe("DawStore", () => {
  beforeEach(() => {
    // Reset store between tests
    useDawStore.setState({
      transportState: "stopped",
      bpm: 120,
      cursorSeconds: 0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      engineStatus: "uninitialized",
    });
  });

  describe("transport", () => {
    it("initializes with stopped state and 120 BPM", () => {
      const state = useDawStore.getState();
      expect(state.transportState).toBe("stopped");
      expect(state.bpm).toBe(120);
      expect(state.cursorSeconds).toBe(0);
    });

    it("transitions to playing", () => {
      useDawStore.getState().play();
      expect(useDawStore.getState().transportState).toBe("playing");
    });

    it("transitions to paused", () => {
      useDawStore.getState().play();
      useDawStore.getState().pause();
      expect(useDawStore.getState().transportState).toBe("paused");
    });

    it("stop resets cursor to 0", () => {
      useDawStore.getState().setCursor(5.0);
      useDawStore.getState().play();
      useDawStore.getState().stop();
      expect(useDawStore.getState().transportState).toBe("stopped");
      expect(useDawStore.getState().cursorSeconds).toBe(0);
    });

    it("sets BPM", () => {
      useDawStore.getState().setBpm(140);
      expect(useDawStore.getState().bpm).toBe(140);
    });

    it("clamps BPM to minimum of 20", () => {
      useDawStore.getState().setBpm(0);
      expect(useDawStore.getState().bpm).toBe(20);
    });

    it("clamps BPM to maximum of 999", () => {
      useDawStore.getState().setBpm(2000);
      expect(useDawStore.getState().bpm).toBe(999);
    });

    it("ignores NaN BPM", () => {
      useDawStore.getState().setBpm(NaN);
      expect(useDawStore.getState().bpm).toBe(120);
    });

    it("sets cursor position", () => {
      useDawStore.getState().setCursor(3.5);
      expect(useDawStore.getState().cursorSeconds).toBe(3.5);
    });

    it("enables loop with start/end", () => {
      useDawStore.getState().setLoop(true, 1.0, 4.0);
      const state = useDawStore.getState();
      expect(state.loopEnabled).toBe(true);
      expect(state.loopStart).toBe(1.0);
      expect(state.loopEnd).toBe(4.0);
    });

    it("disables loop keeping previous boundaries", () => {
      useDawStore.getState().setLoop(true, 1.0, 4.0);
      useDawStore.getState().setLoop(false);
      const state = useDawStore.getState();
      expect(state.loopEnabled).toBe(false);
      expect(state.loopStart).toBe(1.0);
      expect(state.loopEnd).toBe(4.0);
    });
  });

  describe("moveClip", () => {
    const track1: TrackModel = {
      id: "t1",
      name: "Track 1",
      type: "audio",
      color: "#ff0000",
      muted: false,
      solo: false,
      armed: false,
      soloIsolate: false,
      volume: 1,
      pan: 0,
      clipIds: [],
    };
    const track2: TrackModel = { ...track1, id: "t2", name: "Track 2" };
    const clip: AudioClipModel = {
      type: "audio",
      id: "c1",
      trackId: "t1",
      sourceId: "src1",
      startTime: 0,
      sourceOffset: 0,
      duration: 1,
      gain: 1,
      fadeIn: 0,
      fadeOut: 0,
      name: "Clip 1",
    };

    beforeEach(() => {
      useDawStore.setState({ tracks: [], clips: {} });
      useDawStore.getState().addTrack(track1);
      useDawStore.getState().addTrack(track2);
      useDawStore.getState().addClip(clip);
    });

    it("does not move clip to non-existent track", () => {
      useDawStore.getState().moveClip("c1", 5.0, "nonexistent");
      const state = useDawStore.getState();
      const movedClip = state.clips["c1"];
      // Clip should remain on original track
      expect(movedClip?.trackId).toBe("t1");
    });

    it("moves clip to an existing track", () => {
      useDawStore.getState().moveClip("c1", 5.0, "t2");
      const state = useDawStore.getState();
      const movedClip = state.clips["c1"];
      expect(movedClip?.trackId).toBe("t2");
      expect(movedClip?.startTime).toBe(5.0);
    });
  });

  describe("engine status", () => {
    it("initializes as uninitialized", () => {
      expect(useDawStore.getState().engineStatus).toBe("uninitialized");
    });

    it("updates engine status", () => {
      useDawStore.getState().setEngineStatus("running");
      expect(useDawStore.getState().engineStatus).toBe("running");
    });
  });
});
