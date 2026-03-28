import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Fader } from "./Fader";

describe("Fader", () => {
  const defaultProps = {
    value: 50,
    min: 0,
    max: 100,
    onChange: vi.fn(),
    label: "Volume",
  };

  it("renders with correct ARIA attributes", () => {
    render(<Fader {...defaultProps} />);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-label", "Volume");
  });

  it("has aria-orientation vertical", () => {
    render(<Fader {...defaultProps} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-orientation", "vertical");
  });

  it("increases value on ArrowUp", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it("decreases value on ArrowDown", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith(49);
  });

  it("sets min value on Home", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "Home" });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("sets max value on End", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("clamps value to max on ArrowUp at max", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} value={100} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("clamps value to min on ArrowDown at min", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} value={0} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("respects custom step", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} step={5} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(55);
  });

  it("handles PageUp with 10x step", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "PageUp" });
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("handles PageDown with 10x step", () => {
    const onChange = vi.fn();
    render(<Fader {...defaultProps} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "PageDown" });
    expect(onChange).toHaveBeenCalledWith(40);
  });

  it("displays the label", () => {
    render(<Fader {...defaultProps} />);
    expect(screen.getByText("Volume")).toBeInTheDocument();
  });

  it("has tabIndex 0 on the slider container", () => {
    render(<Fader {...defaultProps} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("tabindex", "0");
  });
});
