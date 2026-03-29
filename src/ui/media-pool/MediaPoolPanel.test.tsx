import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MediaPoolPanel } from "./MediaPoolPanel";
import type { AudioSourceHandle, MediaPool } from "@audio/media-pool";

function mockPool(sources: AudioSourceHandle[] = []): MediaPool {
  return {
    importFile: vi.fn(),
    getSource: (id: string) => sources.find((s) => s.id === id),
    getAudioBuffer: vi.fn().mockResolvedValue(undefined),
    getPeaks: vi.fn().mockResolvedValue(undefined),
    listSources: () => sources,
    removeSource: vi.fn(),
    count: sources.length,
    init: vi.fn().mockResolvedValue(undefined),
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

  it("shows error when removeSource fails", async () => {
    const pool = mockPool([SAMPLE_HANDLE]);
    (pool.removeSource as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("IDB error"),
    );
    render(<MediaPoolPanel pool={pool} />);
    // Click the remove button on the item
    const removeBtn = screen.getByRole("button", { name: /remove/i });
    await act(async () => {
      await userEvent.click(removeBtn);
    });
    expect(await screen.findByText(/failed to remove/i)).toBeInTheDocument();
  });
});
