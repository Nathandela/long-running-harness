/**
 * Integration test: verifies the full automation bridge
 * from store data -> AutomationScheduler -> AudioParam values.
 *
 * This test proves that the automation system works end-to-end:
 * store adds lane+points -> scheduler evaluates curve -> AudioParam receives values.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAutomationStore } from "@state/automation";
import { createAutomationScheduler } from "@audio/automation/automation-scheduler";
import type { ParamResolver } from "@audio/automation/automation-scheduler";
import { _resetLaneCounter } from "@audio/automation/automation-types";

type MockParam = {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
  cancelAndHoldAtTime: ReturnType<typeof vi.fn>;
};

function mockAudioParam(): MockParam {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    cancelAndHoldAtTime: vi.fn(),
  };
}

function getLaneId(trackId: string): string {
  const lane = useAutomationStore.getState().getLanes(trackId)[0];
  if (lane === undefined) throw new Error("lane not found");
  return lane.id;
}

describe("Automation bridge: store -> scheduler -> AudioParam", () => {
  beforeEach(() => {
    useAutomationStore.setState({ lanes: {} });
    _resetLaneCounter();
  });

  it("applies store automation to AudioParam during scheduling", () => {
    const store = useAutomationStore.getState();

    // 1. Add a volume lane for track-1
    store.addLane("track-1", { type: "mixer", param: "volume" });
    const laneId = getLaneId("track-1");

    // 2. Add automation points: volume ramp from 0.0 to 1.0 over 10 seconds
    store.addPoint("track-1", laneId, {
      id: "p1",
      time: 0,
      value: 0,
      interpolation: "linear",
      curve: 0,
    });
    store.addPoint("track-1", laneId, {
      id: "p2",
      time: 10,
      value: 1,
      interpolation: "linear",
      curve: 0,
    });

    // 3. Set up mock AudioParam (simulating a mixer fader gain node)
    const param = mockAudioParam();
    const volumeRange = { min: 0, max: 2 }; // fader range: 0 to 2x

    // 4. Create resolver that maps the lane to our mock param
    const resolver: ParamResolver = (l) => {
      if (l.target.type === "mixer" && l.target.param === "volume") {
        return { param, range: volumeRange };
      }
      return undefined;
    };

    // 5. Create scheduler and schedule a window
    const scheduler = createAutomationScheduler(resolver);
    const lanes = useAutomationStore.getState().getLanes("track-1");

    // Schedule window: arrangement time 0-2, offset 0
    scheduler.scheduleWindow(lanes, 0, 2, 0);

    // 6. Verify AudioParam received correct values
    expect(param.cancelAndHoldAtTime).toHaveBeenCalledWith(0);
    expect(param.setValueAtTime).toHaveBeenCalled();

    // At t=0, normalized value is 0.0, denormalized = 0.0 * (2-0) + 0 = 0.0
    const startCall = param.setValueAtTime.mock.calls[0] as [number, number];
    expect(startCall[0]).toBeCloseTo(0.0, 2);
    expect(startCall[1]).toBe(0); // window start

    // At t=2, normalized value is 0.2 (linear interp 2/10), denormalized = 0.2 * 2 = 0.4
    const endRamps = param.linearRampToValueAtTime.mock.calls as [
      number,
      number,
    ][];
    const endRamp = endRamps[endRamps.length - 1];
    expect(endRamp?.[0]).toBeCloseTo(0.4, 2);
    expect(endRamp?.[1]).toBe(2); // window end
  });

  it("ignores unarmed lanes", () => {
    const store = useAutomationStore.getState();
    store.addLane("track-1", { type: "mixer", param: "volume" });
    const laneId = getLaneId("track-1");

    store.addPoint("track-1", laneId, {
      id: "p1",
      time: 0,
      value: 0.5,
      interpolation: "linear",
      curve: 0,
    });

    // Disarm the lane
    store.setArmed("track-1", laneId, false);

    const param = mockAudioParam();
    const resolver: ParamResolver = (l) => {
      if (l.target.type === "mixer" && l.target.param === "volume") {
        return { param, range: { min: 0, max: 2 } };
      }
      return undefined;
    };

    const scheduler = createAutomationScheduler(resolver);
    const lanes = useAutomationStore.getState().getLanes("track-1");
    scheduler.scheduleWindow(lanes, 0, 1, 0);

    // Should NOT schedule anything because lane is disarmed
    expect(param.setValueAtTime).not.toHaveBeenCalled();
  });

  it("handles pan automation with -1..1 range", () => {
    const store = useAutomationStore.getState();
    store.addLane("track-1", { type: "mixer", param: "pan" });
    const laneId = getLaneId("track-1");

    // Center pan (0.5 normalized -> 0.0 actual)
    store.addPoint("track-1", laneId, {
      id: "p1",
      time: 0,
      value: 0.5,
      interpolation: "linear",
      curve: 0,
    });

    const param = mockAudioParam();
    const resolver: ParamResolver = (l) => {
      if (l.target.type === "mixer" && l.target.param === "pan") {
        return { param, range: { min: -1, max: 1 } };
      }
      return undefined;
    };

    const scheduler = createAutomationScheduler(resolver);
    const lanes = useAutomationStore.getState().getLanes("track-1");
    scheduler.scheduleWindow(lanes, 0, 1, 0);

    expect(param.setValueAtTime).toHaveBeenCalled();
    const startCall = param.setValueAtTime.mock.calls[0] as [number, number];
    // 0.5 normalized with range -1..1 = -1 + 0.5 * 2 = 0.0
    expect(startCall[0]).toBeCloseTo(0.0, 2);
  });

  it("cleans up with cancelAll", () => {
    const store = useAutomationStore.getState();
    store.addLane("track-1", { type: "mixer", param: "volume" });
    const laneId = getLaneId("track-1");

    store.addPoint("track-1", laneId, {
      id: "p1",
      time: 0,
      value: 0.5,
      interpolation: "linear",
      curve: 0,
    });

    const param = mockAudioParam();
    const resolver: ParamResolver = () => ({
      param,
      range: { min: 0, max: 2 },
    });

    const scheduler = createAutomationScheduler(resolver);
    const lanes = useAutomationStore.getState().getLanes("track-1");
    scheduler.scheduleWindow(lanes, 0, 1, 0);
    scheduler.cancelAll();

    expect(param.cancelScheduledValues).toHaveBeenCalled();
  });
});
