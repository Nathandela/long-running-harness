import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { VuMeter } from "./VuMeter";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    set strokeStyle(_v: string) {},
    set fillStyle(_v: string) {},
    set lineWidth(_v: number) {},
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe("VuMeter", () => {
  it("renders a canvas element", () => {
    const { container } = render(<VuMeter level={0.5} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("has role img", () => {
    render(<VuMeter level={0.5} />);
    const meter = screen.getByRole("img");
    expect(meter).toBeInTheDocument();
  });

  it("has aria-label describing the level", () => {
    render(<VuMeter level={0.75} />);
    const meter = screen.getByRole("img");
    expect(meter).toHaveAttribute("aria-label", "Audio level: 75%");
  });

  it("has correct default dimensions", () => {
    const { container } = render(<VuMeter level={0.5} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("width", "12");
    expect(canvas).toHaveAttribute("height", "128");
  });

  it("accepts custom dimensions", () => {
    const { container } = render(<VuMeter level={0.5} width={24} height={200} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("width", "24");
    expect(canvas).toHaveAttribute("height", "200");
  });

  it("reflects clip indicator in aria-label", () => {
    render(<VuMeter level={0.95} clip={true} />);
    const meter = screen.getByRole("img");
    expect(meter).toHaveAttribute("aria-label", "Audio level: 95% (clipping)");
  });

  it("does not mention clipping when clip is false", () => {
    render(<VuMeter level={0.95} clip={false} />);
    const meter = screen.getByRole("img");
    expect(meter).toHaveAttribute("aria-label", "Audio level: 95%");
  });

  it("does not mention clipping when clip is undefined", () => {
    render(<VuMeter level={0.95} />);
    const meter = screen.getByRole("img");
    expect(meter).toHaveAttribute("aria-label", "Audio level: 95%");
  });
});
