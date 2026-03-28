import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WaveformPreview } from "./WaveformPreview";
import type { WaveformPeaks } from "@audio/media-pool";

const MOCK_PEAKS: WaveformPeaks = {
  sourceId: "test-1",
  samplesPerPeak: 256,
  peaks: new Float32Array([0.1, 0.5, -0.3, 0.8]),
  length: 2,
};

describe("WaveformPreview", () => {
  it("renders a canvas element", () => {
    render(<WaveformPreview peaks={MOCK_PEAKS} />);
    const canvas = screen.getByRole("img");
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("has accessible label", () => {
    render(<WaveformPreview peaks={MOCK_PEAKS} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Waveform");
  });

  it("renders with specified height", () => {
    render(<WaveformPreview peaks={MOCK_PEAKS} height={32} />);
    const canvas = screen.getByRole("img");
    expect(canvas).toHaveAttribute("height", "32");
  });
});
