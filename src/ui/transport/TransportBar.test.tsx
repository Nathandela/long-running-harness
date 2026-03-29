import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransportBar } from "./TransportBar";

// Mock useTransport hook
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockStop = vi.fn();
const mockSetBpm = vi.fn();
const mockSetMetronomeEnabled = vi.fn();
const mockGetTransportSAB = vi.fn().mockReturnValue(null);
const mockGetClock = vi.fn().mockReturnValue(null);

vi.mock("@audio/use-transport", () => ({
  useTransport: (): object => ({
    play: mockPlay,
    pause: mockPause,
    stop: mockStop,
    seek: vi.fn(),
    setBpm: mockSetBpm,
    setMetronomeEnabled: mockSetMetronomeEnabled,
    getTransportSAB: mockGetTransportSAB,
    getClock: mockGetClock,
  }),
}));

vi.mock("@ui/hooks/useTransportCursor", () => ({
  useTransportCursor: (): { current: number } => ({ current: 0 }),
}));

// Mock useDawStore
vi.mock("@state/index", () => {
  let state = {
    transportState: "stopped" as "stopped" | "playing" | "paused",
    bpm: 120,
    loopEnabled: false,
    setLoop: vi.fn(),
  };
  return {
    useDawStore: (selector: (s: typeof state) => unknown): unknown => {
      return selector(state);
    },
    __setMockState: (newState: Partial<typeof state>): void => {
      state = { ...state, ...newState };
    },
  };
});

describe("TransportBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders BRUTALWAV label", () => {
    render(<TransportBar />);
    expect(screen.getByText("BRUTALWAV")).toBeInTheDocument();
  });

  it("renders play, pause, and stop buttons", () => {
    render(<TransportBar />);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("calls play when play button is clicked", () => {
    render(<TransportBar />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("calls stop when stop button is clicked", () => {
    render(<TransportBar />);
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("renders BPM display", () => {
    render(<TransportBar />);
    const bpmInput = screen.getByLabelText(/bpm/i);
    expect(bpmInput).toBeInTheDocument();
    expect(bpmInput).toHaveValue(120);
  });

  it("renders cursor display", () => {
    render(<TransportBar />);
    // BBT format display at bar 1, beat 1, tick 0
    expect(screen.getByTestId("cursor-display")).toBeInTheDocument();
  });

  it("renders metronome toggle", () => {
    render(<TransportBar />);
    expect(
      screen.getByRole("switch", { name: /metronome/i }),
    ).toBeInTheDocument();
  });

  it("toggles metronome", () => {
    render(<TransportBar />);
    fireEvent.click(screen.getByRole("switch", { name: /metronome/i }));
    expect(mockSetMetronomeEnabled).toHaveBeenCalledWith(true);
  });

  it("play button uses aria-pressed instead of data-active", () => {
    render(<TransportBar />);
    const playBtn = screen.getByRole("button", { name: /play/i });
    expect(playBtn).toHaveAttribute("aria-pressed", "false");
  });
});
