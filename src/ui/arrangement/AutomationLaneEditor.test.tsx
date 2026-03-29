import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AutomationLaneEditor } from "./AutomationLaneEditor";
import { useAutomationStore } from "@state/automation";

// Reset automation store between tests
beforeEach(() => {
  useAutomationStore.setState({ lanes: {} });
});

describe("AutomationLaneEditor", () => {
  const defaultProps = {
    trackId: "track-1",
    viewStartSec: 0,
    viewEndSec: 10,
    trackHeight: 64,
  };

  it("renders a toggle button for showing automation", () => {
    render(<AutomationLaneEditor {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /automation/i }),
    ).toBeInTheDocument();
  });

  it("adds a volume lane when toggle is clicked", () => {
    render(<AutomationLaneEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /automation/i }));

    const lanes = useAutomationStore.getState().getLanes("track-1");
    expect(lanes.length).toBe(1);
    expect(lanes[0]?.target).toEqual({ type: "mixer", param: "volume" });
  });

  it("removes the lane when toggle is clicked again", () => {
    // Add a lane first
    useAutomationStore
      .getState()
      .addLane("track-1", { type: "mixer", param: "volume" });
    const laneId = useAutomationStore.getState().getLanes("track-1")[0]?.id;
    expect(laneId).toBeDefined();

    render(<AutomationLaneEditor {...defaultProps} />);
    // Click to remove
    fireEvent.click(screen.getByRole("button", { name: /automation/i }));

    const lanes = useAutomationStore.getState().getLanes("track-1");
    expect(lanes.length).toBe(0);
  });

  it("adds a point on click in the lane area", () => {
    // Set up a lane
    useAutomationStore
      .getState()
      .addLane("track-1", { type: "mixer", param: "volume" });

    render(<AutomationLaneEditor {...defaultProps} />);
    const canvas = screen.getByTestId("automation-lane-canvas");

    // Click to add a point
    fireEvent.click(canvas, { clientX: 50, clientY: 32 });

    const lanes = useAutomationStore.getState().getLanes("track-1");
    expect(lanes[0]?.points.length).toBe(1);
  });

  it("does not add a duplicate point when clicking an existing point without dragging", () => {
    // Set up a lane with one point
    useAutomationStore
      .getState()
      .addLane("track-1", { type: "mixer", param: "volume" });
    const lane = useAutomationStore.getState().getLanes("track-1")[0];
    if (!lane) throw new Error("lane not found");
    useAutomationStore.getState().addPoint("track-1", lane.id, {
      id: "pt-existing",
      time: 5,
      value: 0.5,
      interpolation: "linear" as const,
      curve: 0,
    });

    render(<AutomationLaneEditor {...defaultProps} />);
    const canvas = screen.getByTestId("automation-lane-canvas");

    // Mock getBoundingClientRect so hit-testing works in jsdom
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 64,
      width: 100,
      height: 64,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Point at time=5 in [0,10]s on 100px => clientX=50
    // Value 0.5 in 64px (top=1, bottom=0) => clientY=32
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 32, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    fireEvent.click(canvas, { clientX: 50, clientY: 32 });

    const points = useAutomationStore.getState().getLanes("track-1")[0]?.points;
    expect(points?.length).toBe(1);
  });
});
