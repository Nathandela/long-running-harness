import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BounceDialog } from "./BounceDialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

// Mock stores
vi.mock("@state/store", () => ({
  useDawStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        tracks: [],
        clips: {},
        bpm: 120,
        masterVolume: 1,
        loopStart: 0,
        loopEnd: 10,
      }),
    {
      getState: () => ({
        tracks: [],
        clips: {},
        bpm: 120,
        masterVolume: 1,
        loopStart: 0,
        loopEnd: 10,
      }),
    },
  ),
}));

vi.mock("@state/automation", () => ({
  useAutomationStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ lanes: {} }),
    {
      getState: () => ({ lanes: {} }),
    },
  ),
}));

const mockCancel = vi.fn();
let bounceResolve: (() => void) | null = null;

vi.mock("@audio/bounce", () => ({
  createBounceEngine: () => ({
    bounce: async function* () {
      yield {
        phase: "rendering" as const,
        progress: 0.5,
        renderedSeconds: 5,
        totalSeconds: 10,
      };
      // Pause here so tests can observe the progress bar
      await new Promise<void>((resolve) => {
        bounceResolve = resolve;
      });
      return {
        blob: new Blob(["wav"], { type: "audio/wav" }),
        duration: 10,
        sampleRate: 48000,
        channels: 2,
      };
    },
    cancel: mockCancel,
  }),
}));

describe("BounceDialog", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    render(<BounceDialog open={false} onClose={onClose} />);
    expect(screen.queryByText("Export Audio")).not.toBeInTheDocument();
  });

  it("shows title and format info when open", () => {
    render(<BounceDialog open={true} onClose={onClose} />);
    expect(screen.getByText("Export Audio")).toBeInTheDocument();
    expect(screen.getByText(/WAV/)).toBeInTheDocument();
    expect(screen.getByText(/48kHz/)).toBeInTheDocument();
    expect(screen.getByText(/32-bit/)).toBeInTheDocument();
  });

  it("has Full Session and Loop Region range options", () => {
    render(<BounceDialog open={true} onClose={onClose} />);
    expect(screen.getByLabelText("Full Session")).toBeInTheDocument();
    expect(screen.getByLabelText("Loop Region")).toBeInTheDocument();
  });

  it("defaults to Full Session range", () => {
    render(<BounceDialog open={true} onClose={onClose} />);
    const radio = screen.getByLabelText("Full Session");
    expect(radio).toBeChecked();
  });

  it("has a Bounce button", () => {
    render(<BounceDialog open={true} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /bounce/i })).toBeInTheDocument();
  });

  it("has a Cancel button that calls onClose", () => {
    render(<BounceDialog open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows progress bar during bounce", async () => {
    bounceResolve = null;
    render(<BounceDialog open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /bounce/i }));
    await waitFor(() => {
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
    // Allow the generator to finish so no leaked promises
    bounceResolve?.();
  });
});
