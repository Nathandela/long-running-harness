import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("renders with role switch", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Mute" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("renders with aria-checked false when off", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Mute" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("renders with aria-checked true when on", () => {
    render(<Toggle checked={true} onChange={vi.fn()} label="Mute" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with toggled value on click", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Mute" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when currently on", () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} label="Mute" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(
      <Toggle checked={false} onChange={onChange} label="Mute" disabled />,
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has accessible label via aria-label", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Mute" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "Mute");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Mute" disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
