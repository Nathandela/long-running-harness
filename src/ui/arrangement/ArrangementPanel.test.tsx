import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useDawStore } from "@state/store";

// Mock media pool and audio engine hooks (stable references to avoid infinite re-render loops)
const mockPool = { getPeaks: vi.fn().mockResolvedValue(undefined) };
vi.mock("@audio/media-pool/use-media-pool", () => ({
  useMediaPool: () => mockPool,
}));

const mockEngine = { ctx: { sampleRate: 44100 } };
vi.mock("@audio/use-audio-engine", () => ({
  useAudioEngine: () => mockEngine,
}));

vi.mock("@audio/use-transport", () => ({
  useTransport: () => ({
    getTransportSAB: () => null,
  }),
}));

vi.mock("@ui/hooks/useTransportCursor", () => ({
  useTransportCursor: () => ({ current: 0 }),
}));

// Mock ResizeObserver
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
);

// Import after mocks
const { ArrangementPanel } = await import("./ArrangementPanel");

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
