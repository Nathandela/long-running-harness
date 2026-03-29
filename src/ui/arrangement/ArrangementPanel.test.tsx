import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArrangementPanel } from "./ArrangementPanel";
import { useDawStore } from "@state/store";

// Mock ResizeObserver
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
);

describe("ArrangementPanel", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedClipIds: [],
      cursorSeconds: 0,
      bpm: 120,
      transportState: "stopped",
    });
  });

  it("renders arrangement panel", () => {
    render(<ArrangementPanel />);
    expect(screen.getByTestId("arrangement-panel")).toBeInTheDocument();
  });

  it("canvas has role=application and aria-label", () => {
    render(<ArrangementPanel />);
    const canvas = screen.getByRole("application");
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute("aria-label", "Arrangement timeline");
  });

  it("canvas has aria-describedby referencing keyboard hints", () => {
    render(<ArrangementPanel />);
    const canvas = screen.getByRole("application");
    expect(canvas).toHaveAttribute("aria-describedby", "arrangement-keys");
    const hints = document.getElementById("arrangement-keys");
    expect(hints).toBeTruthy();
    expect(hints?.textContent).toContain("Scroll");
    expect(hints?.textContent).toContain("Zoom");
  });
});
