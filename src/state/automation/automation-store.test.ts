import { describe, it, expect, beforeEach } from "vitest";
import { useAutomationStore } from "./automation-store";
import type { AutomationPoint, ParameterTarget } from "@audio/automation";
import { _resetLaneCounter } from "@audio/automation/automation-types";

const volumeTarget: ParameterTarget = { type: "mixer", param: "volume" };
const panTarget: ParameterTarget = { type: "mixer", param: "pan" };

function pt(id: string, time: number, value: number): AutomationPoint {
  return { id, time, value, interpolation: "linear", curve: 0 };
}

describe("AutomationStore", () => {
  beforeEach(() => {
    useAutomationStore.setState({ lanes: {} });
    _resetLaneCounter();
  });

  describe("addLane", () => {
    it("creates a lane for a track+target", () => {
      const { addLane, getLanes } = useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const lanes = getLanes("track-1");
      expect(lanes).toHaveLength(1);
      expect(lanes[0]?.target).toEqual(volumeTarget);
      expect(lanes[0]?.points).toEqual([]);
      expect(lanes[0]?.mode).toBe("read");
      expect(lanes[0]?.armed).toBe(true);
    });

    it("allows multiple lanes per track", () => {
      const { addLane, getLanes } = useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      addLane("track-1", panTarget);
      expect(getLanes("track-1")).toHaveLength(2);
    });
  });

  describe("removeLane", () => {
    it("removes a lane by id", () => {
      const { addLane, removeLane, getLanes } = useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const laneId = getLanes("track-1")[0]?.id ?? "";
      removeLane("track-1", laneId);
      expect(getLanes("track-1")).toHaveLength(0);
    });
  });

  describe("addPoint", () => {
    it("adds a point to a lane in sorted order", () => {
      const { addLane, addPoint, getLanes } = useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const laneId = getLanes("track-1")[0]?.id ?? "";

      addPoint("track-1", laneId, pt("p1", 5, 0.5));
      addPoint("track-1", laneId, pt("p2", 2, 0.3));

      const updated = getLanes("track-1")[0];
      expect(updated?.points).toHaveLength(2);
      expect(updated?.points[0]?.time).toBe(2);
      expect(updated?.points[1]?.time).toBe(5);
    });
  });

  describe("removePoint", () => {
    it("removes a point by id", () => {
      const { addLane, addPoint, removePoint, getLanes } =
        useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const laneId = getLanes("track-1")[0]?.id ?? "";
      addPoint("track-1", laneId, pt("p1", 5, 0.5));

      removePoint("track-1", laneId, "p1");
      const updated = getLanes("track-1")[0];
      expect(updated?.points).toHaveLength(0);
    });
  });

  describe("movePoint", () => {
    it("updates time and value of a point", () => {
      const { addLane, addPoint, movePoint, getLanes } =
        useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const laneId = getLanes("track-1")[0]?.id ?? "";
      addPoint("track-1", laneId, pt("p1", 5, 0.5));

      movePoint("track-1", laneId, "p1", 8, 0.9);
      const updated = getLanes("track-1")[0];
      expect(updated?.points[0]?.time).toBe(8);
      expect(updated?.points[0]?.value).toBe(0.9);
    });
  });

  describe("setMode", () => {
    it("changes automation mode for a lane", () => {
      const { addLane, setMode, getLanes } = useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const laneId = getLanes("track-1")[0]?.id ?? "";

      setMode("track-1", laneId, "write");
      expect(getLanes("track-1")[0]?.mode).toBe("write");

      setMode("track-1", laneId, "touch");
      expect(getLanes("track-1")[0]?.mode).toBe("touch");
    });
  });

  describe("setArmed", () => {
    it("toggles armed state", () => {
      const { addLane, setArmed, getLanes } = useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const laneId = getLanes("track-1")[0]?.id ?? "";

      setArmed("track-1", laneId, false);
      expect(getLanes("track-1")[0]?.armed).toBe(false);

      setArmed("track-1", laneId, true);
      expect(getLanes("track-1")[0]?.armed).toBe(true);
    });
  });

  describe("removeTrackLanes", () => {
    it("removes all lanes for a track", () => {
      const { addLane, removeTrackLanes, getLanes } =
        useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      addLane("track-1", panTarget);

      removeTrackLanes("track-1");
      expect(getLanes("track-1")).toHaveLength(0);
    });
  });

  describe("getLane", () => {
    it("returns specific lane by id", () => {
      const { addLane, getLane, getLanes } = useAutomationStore.getState();
      addLane("track-1", volumeTarget);
      const laneId = getLanes("track-1")[0]?.id ?? "";

      const lane = getLane("track-1", laneId);
      expect(lane).toBeDefined();
      expect(lane?.target).toEqual(volumeTarget);
    });

    it("returns undefined for nonexistent lane", () => {
      const { getLane } = useAutomationStore.getState();
      expect(getLane("track-1", "nope")).toBeUndefined();
    });
  });
});
