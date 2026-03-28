import { describe, it, expect, beforeEach } from "vitest";
import { useDawStore } from "@state/store";
import type { AudioClipModel, TrackModel } from "./types";
import {
  AddTrackCommand,
  RemoveTrackCommand,
  UpdateTrackCommand,
  ReorderTrackCommand,
  AddClipCommand,
  RemoveClipCommand,
  MoveClipCommand,
  SplitClipCommand,
  TrimClipCommand,
  DuplicateClipCommand,
} from "./track-commands";

function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "track-1",
    name: "Track 1",
    type: "audio",
    color: "#ff2d6f",
    muted: false,
    solo: false,
    armed: false,
    soloIsolate: false,
    volume: 1,
    pan: 0,
    clipIds: [],
    ...overrides,
  };
}

function makeClip(overrides: Partial<AudioClipModel> = {}): AudioClipModel {
  return {
    type: "audio",
    id: "clip-1",
    trackId: "track-1",
    sourceId: "source-1",
    startTime: 0,
    sourceOffset: 0,
    duration: 4,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
    name: "Clip 1",
    ...overrides,
  };
}

function getStore(): ReturnType<typeof useDawStore.getState> {
  return useDawStore.getState();
}

describe("Track commands", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedTrackIds: [],
      selectedClipIds: [],
    });
  });

  describe("AddTrackCommand", () => {
    it("execute adds the track to the store", () => {
      const track = makeTrack({ id: "t1" });
      const cmd = new AddTrackCommand(track);
      cmd.execute();
      expect(getStore().tracks).toHaveLength(1);
      expect(getStore().tracks[0]?.id).toBe("t1");
    });

    it("execute inserts at a specific index", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addTrack(makeTrack({ id: "t3" }));
      const cmd = new AddTrackCommand(makeTrack({ id: "t2" }), 1);
      cmd.execute();
      const ids = getStore().tracks.map((t) => t.id);
      expect(ids).toEqual(["t1", "t2", "t3"]);
    });

    it("undo removes the track", () => {
      const track = makeTrack({ id: "t1" });
      const cmd = new AddTrackCommand(track);
      cmd.execute();
      cmd.undo();
      expect(getStore().tracks).toHaveLength(0);
    });

    it("has type add-track", () => {
      const cmd = new AddTrackCommand(makeTrack());
      expect(cmd.type).toBe("add-track");
    });

    it("serializes track and index", () => {
      const track = makeTrack({ id: "t1" });
      const cmd = new AddTrackCommand(track, 2);
      const data = cmd.serialize();
      expect(data["track"]).toEqual(track);
      expect(data["index"]).toBe(2);
    });
  });

  describe("RemoveTrackCommand", () => {
    it("execute removes the track", () => {
      const track = makeTrack({ id: "t1" });
      getStore().addTrack(track);
      const cmd = new RemoveTrackCommand("t1");
      cmd.execute();
      expect(getStore().tracks).toHaveLength(0);
    });

    it("undo restores the track at its original index", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addTrack(makeTrack({ id: "t2" }));
      getStore().addTrack(makeTrack({ id: "t3" }));

      const cmd = new RemoveTrackCommand("t2");
      cmd.execute();
      expect(getStore().tracks).toHaveLength(2);

      cmd.undo();
      expect(getStore().tracks).toHaveLength(3);
      expect(getStore().tracks[1]?.id).toBe("t2");
    });

    it("undo restores associated clips", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      getStore().addClip(makeClip({ id: "c2", trackId: "t1" }));

      const cmd = new RemoveTrackCommand("t1");
      cmd.execute();
      expect(getStore().clips["c1"]).toBeUndefined();

      cmd.undo();
      expect(getStore().clips["c1"]).toBeDefined();
      expect(getStore().clips["c2"]).toBeDefined();
    });

    it("has type remove-track", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const cmd = new RemoveTrackCommand("t1");
      expect(cmd.type).toBe("remove-track");
    });

    it("serializes the track id", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const cmd = new RemoveTrackCommand("t1");
      const data = cmd.serialize();
      expect(data["trackId"]).toBe("t1");
    });
  });

  describe("UpdateTrackCommand", () => {
    it("execute applies the patch", () => {
      getStore().addTrack(makeTrack({ id: "t1", name: "Old" }));
      const cmd = new UpdateTrackCommand("t1", { name: "New" });
      cmd.execute();
      expect(getStore().tracks[0]?.name).toBe("New");
    });

    it("undo restores the old values", () => {
      getStore().addTrack(makeTrack({ id: "t1", name: "Old", muted: false }));
      const cmd = new UpdateTrackCommand("t1", { name: "New", muted: true });
      cmd.execute();
      cmd.undo();
      expect(getStore().tracks[0]?.name).toBe("Old");
      expect(getStore().tracks[0]?.muted).toBe(false);
    });

    it("has type update-track", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const cmd = new UpdateTrackCommand("t1", { name: "X" });
      expect(cmd.type).toBe("update-track");
    });

    it("serializes id and both patches", () => {
      getStore().addTrack(makeTrack({ id: "t1", name: "Old" }));
      const cmd = new UpdateTrackCommand("t1", { name: "New" });
      const data = cmd.serialize();
      expect(data["trackId"]).toBe("t1");
      expect(data["newPatch"]).toEqual({ name: "New" });
    });
  });

  describe("ReorderTrackCommand", () => {
    it("execute moves track to target index", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addTrack(makeTrack({ id: "t2" }));
      getStore().addTrack(makeTrack({ id: "t3" }));

      const cmd = new ReorderTrackCommand("t3", 0);
      cmd.execute();
      const ids = getStore().tracks.map((t) => t.id);
      expect(ids).toEqual(["t3", "t1", "t2"]);
    });

    it("undo moves track back to original index", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addTrack(makeTrack({ id: "t2" }));
      getStore().addTrack(makeTrack({ id: "t3" }));

      const cmd = new ReorderTrackCommand("t3", 0);
      cmd.execute();
      cmd.undo();
      const ids = getStore().tracks.map((t) => t.id);
      expect(ids).toEqual(["t1", "t2", "t3"]);
    });

    it("has type reorder-track", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const cmd = new ReorderTrackCommand("t1", 0);
      expect(cmd.type).toBe("reorder-track");
    });

    it("serializes id, fromIndex, and toIndex", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addTrack(makeTrack({ id: "t2" }));
      const cmd = new ReorderTrackCommand("t2", 0);
      const data = cmd.serialize();
      expect(data["trackId"]).toBe("t2");
      expect(data["toIndex"]).toBe(0);
    });
  });

  describe("AddClipCommand", () => {
    it("execute adds the clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const clip = makeClip({ id: "c1", trackId: "t1" });
      const cmd = new AddClipCommand(clip);
      cmd.execute();
      expect(getStore().clips["c1"]).toBeDefined();
      expect(getStore().tracks[0]?.clipIds).toContain("c1");
    });

    it("undo removes the clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const clip = makeClip({ id: "c1", trackId: "t1" });
      const cmd = new AddClipCommand(clip);
      cmd.execute();
      cmd.undo();
      expect(getStore().clips["c1"]).toBeUndefined();
    });

    it("has type add-clip", () => {
      const cmd = new AddClipCommand(makeClip());
      expect(cmd.type).toBe("add-clip");
    });

    it("serializes the clip", () => {
      const clip = makeClip({ id: "c1" });
      const cmd = new AddClipCommand(clip);
      expect(cmd.serialize()["clip"]).toEqual(clip);
    });
  });

  describe("RemoveClipCommand", () => {
    it("execute removes the clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new RemoveClipCommand("c1");
      cmd.execute();
      expect(getStore().clips["c1"]).toBeUndefined();
    });

    it("undo restores the clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      const clip = makeClip({ id: "c1", trackId: "t1" });
      getStore().addClip(clip);
      const cmd = new RemoveClipCommand("c1");
      cmd.execute();
      cmd.undo();
      expect(getStore().clips["c1"]).toBeDefined();
      expect(getStore().tracks[0]?.clipIds).toContain("c1");
    });

    it("has type remove-clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new RemoveClipCommand("c1");
      expect(cmd.type).toBe("remove-clip");
    });

    it("serializes the clip id", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new RemoveClipCommand("c1");
      expect(cmd.serialize()["clipId"]).toBe("c1");
    });
  });

  describe("MoveClipCommand", () => {
    it("execute moves the clip to a new time", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1", startTime: 0 }));
      const cmd = new MoveClipCommand("c1", 5);
      cmd.execute();
      expect(getStore().clips["c1"]?.startTime).toBe(5);
    });

    it("execute moves the clip to a different track", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addTrack(makeTrack({ id: "t2" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1", startTime: 0 }));
      const cmd = new MoveClipCommand("c1", 3, "t2");
      cmd.execute();
      expect(getStore().clips["c1"]?.startTime).toBe(3);
      expect(getStore().clips["c1"]?.trackId).toBe("t2");
    });

    it("undo restores original position and track", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addTrack(makeTrack({ id: "t2" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1", startTime: 2 }));
      const cmd = new MoveClipCommand("c1", 7, "t2");
      cmd.execute();
      cmd.undo();
      expect(getStore().clips["c1"]?.startTime).toBe(2);
      expect(getStore().clips["c1"]?.trackId).toBe("t1");
    });

    it("has type move-clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1", startTime: 0 }));
      const cmd = new MoveClipCommand("c1", 5);
      expect(cmd.type).toBe("move-clip");
    });

    it("serializes clip id, old and new positions", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1", startTime: 2 }));
      const cmd = new MoveClipCommand("c1", 5, "t2");
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("c1");
      expect(data["newStartTime"]).toBe(5);
      expect(data["newTrackId"]).toBe("t2");
    });
  });

  describe("SplitClipCommand", () => {
    it("execute splits the clip at the given time", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      const cmd = new SplitClipCommand("c1", 5);
      cmd.execute();

      const left = getStore().clips["c1"];
      expect(left?.duration).toBe(3);
      expect(left?.startTime).toBe(2);

      // The right clip should exist with the generated id
      const rightId = cmd.rightClipId();
      expect(rightId).toBeDefined();
      if (rightId !== undefined) {
        const right = getStore().clips[rightId];
        expect(right?.startTime).toBe(5);
        expect(right?.duration).toBe(3);
        expect(right?.sourceOffset).toBe(3);
      }
    });

    it("undo rejoins the clip (restores original, removes right)", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      const cmd = new SplitClipCommand("c1", 5);
      cmd.execute();
      const rightId = cmd.rightClipId();

      cmd.undo();
      const restored = getStore().clips["c1"];
      expect(restored?.duration).toBe(6);
      expect(restored?.startTime).toBe(2);
      expect(restored?.sourceOffset).toBe(0);

      if (rightId !== undefined) {
        expect(getStore().clips[rightId]).toBeUndefined();
      }
    });

    it("has type split-clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new SplitClipCommand("c1", 2);
      expect(cmd.type).toBe("split-clip");
    });

    it("serializes clip id and split time", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new SplitClipCommand("c1", 2);
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("c1");
      expect(data["atTime"]).toBe(2);
    });
  });

  describe("TrimClipCommand", () => {
    it("execute trims the clip start", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      const cmd = new TrimClipCommand("c1", 4, undefined);
      cmd.execute();
      const clip = getStore().clips["c1"];
      expect(clip?.startTime).toBe(4);
      expect(clip?.sourceOffset).toBe(2);
      expect(clip?.duration).toBe(4);
    });

    it("execute trims the clip end", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      const cmd = new TrimClipCommand("c1", undefined, 5);
      cmd.execute();
      const clip = getStore().clips["c1"];
      expect(clip?.startTime).toBe(2);
      expect(clip?.duration).toBe(3);
    });

    it("undo restores the original clip state", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(
        makeClip({
          id: "c1",
          trackId: "t1",
          startTime: 2,
          sourceOffset: 0,
          duration: 6,
        }),
      );
      const cmd = new TrimClipCommand("c1", 4, 7);
      cmd.execute();
      cmd.undo();
      const clip = getStore().clips["c1"];
      expect(clip?.startTime).toBe(2);
      expect(clip?.sourceOffset).toBe(0);
      expect(clip?.duration).toBe(6);
    });

    it("has type trim-clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new TrimClipCommand("c1", 1, undefined);
      expect(cmd.type).toBe("trim-clip");
    });

    it("serializes clip id and trim values", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new TrimClipCommand("c1", 1, 3);
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("c1");
      expect(data["newStart"]).toBe(1);
      expect(data["newEnd"]).toBe(3);
    });
  });

  describe("DuplicateClipCommand", () => {
    it("execute duplicates the clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(
        makeClip({ id: "c1", trackId: "t1", startTime: 2, duration: 4 }),
      );
      const cmd = new DuplicateClipCommand("c1");
      cmd.execute();

      const newId = cmd.duplicatedClipId();
      expect(newId).toBeDefined();
      if (newId !== undefined) {
        const dup = getStore().clips[newId];
        expect(dup?.startTime).toBe(6);
        expect(dup?.duration).toBe(4);
      }
    });

    it("undo removes the duplicated clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(
        makeClip({ id: "c1", trackId: "t1", startTime: 2, duration: 4 }),
      );
      const cmd = new DuplicateClipCommand("c1");
      cmd.execute();
      const newId = cmd.duplicatedClipId();

      cmd.undo();
      if (newId !== undefined) {
        expect(getStore().clips[newId]).toBeUndefined();
      }
      // Original should still exist
      expect(getStore().clips["c1"]).toBeDefined();
    });

    it("has type duplicate-clip", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new DuplicateClipCommand("c1");
      expect(cmd.type).toBe("duplicate-clip");
    });

    it("serializes the source clip id", () => {
      getStore().addTrack(makeTrack({ id: "t1" }));
      getStore().addClip(makeClip({ id: "c1", trackId: "t1" }));
      const cmd = new DuplicateClipCommand("c1");
      const data = cmd.serialize();
      expect(data["clipId"]).toBe("c1");
    });
  });
});
