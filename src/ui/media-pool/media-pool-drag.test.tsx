/**
 * Tests for W3: Media pool item drag functionality.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MediaPoolItem } from "./MediaPoolItem";
import type { AudioSourceHandle } from "@audio/media-pool";

function makeSource(
  overrides: Partial<AudioSourceHandle> = {},
): AudioSourceHandle {
  return {
    id: "src-1",
    name: "kick.wav",
    format: "wav",
    sampleRate: 44100,
    channels: 2,
    durationSeconds: 1.5,
    fileSizeBytes: 132300,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("MediaPoolItem drag", () => {
  it("is draggable", () => {
    const source = makeSource();
    render(
      <MediaPoolItem source={source} peaks={undefined} onRemove={vi.fn()} />,
    );

    const item = screen.getByTestId("media-item-src-1");
    expect(item).toHaveAttribute("draggable", "true");
  });

  it("sets drag data with source info on dragStart", () => {
    const source = makeSource({
      id: "src-42",
      name: "snare.wav",
      durationSeconds: 0.8,
    });
    render(
      <MediaPoolItem source={source} peaks={undefined} onRemove={vi.fn()} />,
    );

    const item = screen.getByTestId("media-item-src-42");

    const setDataSpy = vi.fn();
    fireEvent.dragStart(item, {
      dataTransfer: {
        setData: setDataSpy,
        effectAllowed: "",
      },
    });

    expect(setDataSpy).toHaveBeenCalledWith(
      "application/x-media-pool-source",
      expect.stringContaining('"sourceId":"src-42"'),
    );
    expect(setDataSpy).toHaveBeenCalledWith(
      "application/x-media-pool-source",
      expect.stringContaining('"durationSeconds":0.8'),
    );
  });
});
