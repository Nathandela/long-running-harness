import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { RotaryKnob } from "./RotaryKnob";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    translate: vi.fn(),
    rotate: vi.fn(),
    set strokeStyle(_v: string) {},
    set fillStyle(_v: string) {},
    set lineWidth(_v: number) {},
    set lineCap(_v: string) {},
    set font(_v: string) {},
    set textAlign(_v: string) {},
    set textBaseline(_v: string) {},
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe("RotaryKnob", () => {
  const defaultProps = {
    value: 50,
    min: 0,
    max: 100,
    onChange: vi.fn(),
    label: "Volume",
  };

  it("renders with correct ARIA attributes", () => {
    render(<RotaryKnob {...defaultProps} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-label", "Volume");
    expect(slider).toHaveAttribute("tabindex", "0");
  });

  it("increases value by step on ArrowUp", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} step={5} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(55);
  });

  it("decreases value by step on ArrowDown", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} step={5} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith(45);
  });

  it("increases value by step on ArrowRight", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it("decreases value by step on ArrowLeft", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(49);
  });

  it("sets value to min on Home key", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("sets value to max on End key", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "End" });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("increases by 10*step on PageUp", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} step={2} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(onChange).toHaveBeenCalledWith(70);
  });

  it("decreases by 10*step on PageDown", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} step={2} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "PageDown" });
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it("clamps value at max", () => {
    const onChange = vi.fn();
    render(
      <RotaryKnob {...defaultProps} value={99} onChange={onChange} step={5} />,
    );
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("clamps value at min", () => {
    const onChange = vi.fn();
    render(
      <RotaryKnob {...defaultProps} value={1} onChange={onChange} step={5} />,
    );
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("displays label text", () => {
    render(<RotaryKnob {...defaultProps} />);
    expect(screen.getByText("Volume")).toBeInTheDocument();
  });

  it("displays formatted value text", () => {
    render(<RotaryKnob {...defaultProps} />);
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders a canvas element", () => {
    const { container } = render(<RotaryKnob {...defaultProps} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("uses default step of 1", () => {
    const onChange = vi.fn();
    render(<RotaryKnob {...defaultProps} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it("responds to pointerdown on canvas", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RotaryKnob {...defaultProps} onChange={onChange} />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    if (canvas === null) return;
    fireEvent.pointerDown(canvas, { clientY: 50 });
    // Just verify it doesn't throw - pointer events are handled
  });

  it("renders aria-valuetext when provided", () => {
    render(<RotaryKnob {...defaultProps} valueText="50%" />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuetext", "50%");
  });

  it("does not render aria-valuetext when not provided", () => {
    render(<RotaryKnob {...defaultProps} />);
    const slider = screen.getByRole("slider");
    expect(slider).not.toHaveAttribute("aria-valuetext");
  });
});
