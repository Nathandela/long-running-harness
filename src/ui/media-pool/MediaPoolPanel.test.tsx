import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MediaPoolPanel } from "./MediaPoolPanel";
import type { AudioSourceHandle, MediaPool } from "@audio/media-pool";

function mockPool(
  sources: AudioSourceHandle[] = [],
): MediaPool & { removeSpy: ReturnType<typeof vi.fn> } {
  const removeSpy = vi.fn();
  return {
    importFile: vi.fn(),
    getSource: (id: string) => sources.find((s) => s.id === id),
    getAudioBuffer: vi.fn().mockResolvedValue(undefined),
    getPeaks: vi.fn().mockResolvedValue(undefined),
    listSources: () => sources,
    removeSource: removeSpy,
    count: sources.length,
    init: vi.fn().mockResolvedValue(undefined),
    removeSpy,
  };
}

const SAMPLE_HANDLE: AudioSourceHandle = {
  id: "s1",
  name: "kick.wav",
  format: "wav",
  sampleRate: 44100,
  channels: 2,
  durationSeconds: 1.5,
  fileSizeBytes: 264_600,
  createdAt: 1711632000000,
};

describe("MediaPoolPanel", () => {
  it("renders MEDIA POOL heading", () => {
    render(<MediaPoolPanel pool={mockPool()} />);
    expect(screen.getByText("MEDIA POOL")).toBeInTheDocument();
  });

  it("renders import button", () => {
    render(<MediaPoolPanel pool={mockPool()} />);
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("renders empty state when no sources", () => {
    render(<MediaPoolPanel pool={mockPool()} />);
    expect(screen.getByText(/drop audio files/i)).toBeInTheDocument();
  });

  it("renders source items when sources exist", () => {
    render(<MediaPoolPanel pool={mockPool([SAMPLE_HANDLE])} />);
    expect(screen.getByText("kick.wav")).toBeInTheDocument();
  });

  it("renders media pool panel with test ID", () => {
    render(<MediaPoolPanel pool={mockPool()} />);
    expect(screen.getByTestId("media-pool-panel")).toBeInTheDocument();
  });

  it("shows undo toast when removing a source", async () => {
    const pool = mockPool([SAMPLE_HANDLE]);
    render(<MediaPoolPanel pool={pool} />);
    const removeBtn = screen.getByRole("button", { name: /remove/i });
    await act(async () => {
      await userEvent.click(removeBtn);
    });
    // Undo toast appears
    expect(screen.getByTestId("undo-toast")).toBeInTheDocument();
    expect(screen.getByText(/removed "kick.wav"/i)).toBeInTheDocument();
    // Item is hidden from the list
    expect(screen.queryByText("kick.wav")).not.toBeInTheDocument();
  });

  it("restores source when undo is clicked", async () => {
    const pool = mockPool([SAMPLE_HANDLE]);
    render(<MediaPoolPanel pool={pool} />);
    const removeBtn = screen.getByRole("button", { name: /remove/i });
    await act(async () => {
      await userEvent.click(removeBtn);
    });
    // Click undo
    await userEvent.click(screen.getByTestId("undo-btn"));
    // Item is back in the list
    expect(screen.getByText("kick.wav")).toBeInTheDocument();
    // removeSource was never called
    expect(pool.removeSpy).not.toHaveBeenCalled();
  });

  it("executes removal after undo window expires", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const pool = mockPool([SAMPLE_HANDLE]);
    pool.removeSpy.mockResolvedValue(undefined);
    render(<MediaPoolPanel pool={pool} />);
    const removeBtn = screen.getByRole("button", { name: /remove/i });
    await userEvent
      .setup({ advanceTimers: vi.advanceTimersByTime })
      .click(removeBtn);
    // Undo toast visible
    expect(screen.getByTestId("undo-toast")).toBeInTheDocument();
    // Fast-forward past the undo window
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    // removeSource was called after expiry
    expect(pool.removeSpy).toHaveBeenCalledWith("s1");
    vi.useRealTimers();
  });
});
