import { describe, it, expect, beforeEach } from "vitest";
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
    trackTop: 0,
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
});
