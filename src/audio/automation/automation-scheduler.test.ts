import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAutomationScheduler } from "./automation-scheduler";
import type {
  AutomationLane,
  AutomationPoint,
  ParameterTarget,
} from "./automation-types";

function pt(
  id: string,
  time: number,
  value: number,
  interpolation: "linear" | "curved" = "linear",
  curve = 0,
): AutomationPoint {
  return { id, time, value, interpolation, curve };
}

function makeLane(
  trackId: string,
  target: ParameterTarget,
  points: AutomationPoint[],
  mode: "read" | "write" | "touch" = "read",
): AutomationLane {
  return {
    id: `lane-${trackId}-${target.type}`,
    trackId,
    target,
    points,
    mode,
    armed: true,
  };
}

// Minimal AudioParam mock with scheduling methods
function mockAudioParam(): {
  param: {
    value: number;
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    cancelScheduledValues: ReturnType<typeof vi.fn>;
    cancelAndHoldAtTime: ReturnType<typeof vi.fn>;
  };
} {
  const param = {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    cancelAndHoldAtTime: vi.fn(),
  };
  return { param };
}

describe("AutomationScheduler", () => {
  const volumeTarget: ParameterTarget = { type: "mixer", param: "volume" };
  const panTarget: ParameterTarget = { type: "mixer", param: "pan" };

  let resolveParam: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resolveParam = vi.fn();
  });

  describe("scheduleWindow", () => {
    it("schedules value at start of window for lane in read mode", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 2 } });

      const lane = makeLane("t1", volumeTarget, [
        pt("p1", 0, 0, "linear"),
        pt("p2", 10, 1, "linear"),
      ]);

      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      // Should schedule values via setValueAtTime
      expect(param.setValueAtTime).toHaveBeenCalled();
    });

    it("does not schedule if lane is not armed", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 2 } });

      const lane: AutomationLane = {
        ...makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]),
        armed: false,
      };

      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      expect(param.setValueAtTime).not.toHaveBeenCalled();
    });

    it("does not schedule if lane has no points", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 2 } });

      const lane = makeLane("t1", volumeTarget, []);
      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      expect(param.setValueAtTime).not.toHaveBeenCalled();
    });

    it("does not schedule in write mode (write mode records, not plays)", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 2 } });

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)], "write");

      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      expect(param.setValueAtTime).not.toHaveBeenCalled();
    });

    it("handles linear interpolation across a scheduling window", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [
        pt("p1", 0, 0, "linear"),
        pt("p2", 10, 1, "linear"),
      ]);

      const scheduler = createAutomationScheduler(resolveParam);
      // Window from t=0 to t=1, timeOffset=100 (arrangement -> audioCtx)
      scheduler.scheduleWindow([lane], 100, 101, 100);

      // Should have scheduled a value at the window start
      expect(param.setValueAtTime).toHaveBeenCalled();
      const call = param.setValueAtTime.mock.calls[0] as [number, number];
      // Value at t=0 is 0 (normalized) -> denormalized to range 0..1 = 0
      expect(call[0]).toBeCloseTo(0, 2);
    });

    it("schedules for pan with range -1..1", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: -1, max: 1 } });

      const lane = makeLane("t1", panTarget, [pt("p1", 0, 0.5)]);

      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      expect(param.setValueAtTime).toHaveBeenCalled();
      // 0.5 normalized with range -1..1 = 0
      const call = param.setValueAtTime.mock.calls[0] as [number, number];
      expect(call[0]).toBeCloseTo(0, 2);
    });

    it("skips lanes where resolveParam returns undefined", () => {
      resolveParam.mockReturnValue(undefined);

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]);
      const scheduler = createAutomationScheduler(resolveParam);

      // Should not throw
      expect(() => {
        scheduler.scheduleWindow([lane], 0, 1, 0);
      }).not.toThrow();
    });

    it("uses linearRamp when a segment spans the scheduling window", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [
        pt("p1", 0, 0, "linear"),
        pt("p2", 10, 1, "linear"),
      ]);

      const scheduler = createAutomationScheduler(resolveParam);
      // Window: arrangement t=0..1 -> audioCtx t=50..51
      scheduler.scheduleWindow([lane], 50, 51, 50);

      expect(param.setValueAtTime).toHaveBeenCalled();
      expect(param.linearRampToValueAtTime).toHaveBeenCalled();
    });

    it("schedules exact breakpoints within the window", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      // Points at t=2, t=5, t=8
      const lane = makeLane("t1", volumeTarget, [
        pt("p1", 2, 0.2, "linear"),
        pt("p2", 5, 0.5, "linear"),
        pt("p3", 8, 0.8, "linear"),
      ]);

      const scheduler = createAutomationScheduler(resolveParam);
      // Window: arrangement t=3..7, offset=10 -> audioCtx t=13..17
      scheduler.scheduleWindow([lane], 13, 17, 10);

      // Should schedule: setValueAtTime at windowStart, linearRamp at t=5 (ctx=15), linearRamp at windowEnd
      expect(param.setValueAtTime).toHaveBeenCalledTimes(1);
      // Breakpoint at t=5 (ctx=15) + window end (ctx=17) = 2 ramp calls
      expect(param.linearRampToValueAtTime).toHaveBeenCalledTimes(2);

      // Check the breakpoint ramp: value 0.5 at ctx time 15
      const rampCalls = param.linearRampToValueAtTime.mock.calls as [
        number,
        number,
      ][];
      expect(rampCalls[0]?.[0]).toBeCloseTo(0.5, 2); // value at breakpoint
      expect(rampCalls[0]?.[1]).toBeCloseTo(15, 2); // ctx time of breakpoint
    });

    it("does nothing for zero-length window", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]);
      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 5, 5, 0);

      expect(param.setValueAtTime).not.toHaveBeenCalled();
    });

    it("uses cancelAndHoldAtTime when available", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]);
      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      expect(param.cancelAndHoldAtTime).toHaveBeenCalledWith(0);
      expect(param.cancelScheduledValues).not.toHaveBeenCalled();
    });

    it("falls back to cancelScheduledValues when cancelAndHoldAtTime is absent", () => {
      const param = {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      };
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]);
      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      expect(param.cancelScheduledValues).toHaveBeenCalledWith(0);
    });
  });

  describe("cancelAll", () => {
    it("cancels scheduled values on all known params", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]);
      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      scheduler.cancelAll();
      expect(param.cancelScheduledValues).toHaveBeenCalled();
    });

    it("tolerates disposed/disconnected params", () => {
      const { param } = mockAudioParam();
      param.cancelScheduledValues.mockImplementation(() => {
        throw new Error("InvalidStateError: node is disconnected");
      });
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]);
      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);

      // Should not throw
      expect(() => {
        scheduler.cancelAll();
      }).not.toThrow();
    });

    it("clears tracked params after cancelAll", () => {
      const { param } = mockAudioParam();
      resolveParam.mockReturnValue({ param, range: { min: 0, max: 1 } });

      const lane = makeLane("t1", volumeTarget, [pt("p1", 0, 0.5)]);
      const scheduler = createAutomationScheduler(resolveParam);
      scheduler.scheduleWindow([lane], 0, 1, 0);
      scheduler.cancelAll();

      // Cancel again — param should not be called again since set was cleared
      param.cancelScheduledValues.mockClear();
      scheduler.cancelAll();
      expect(param.cancelScheduledValues).not.toHaveBeenCalled();
    });
  });
});
