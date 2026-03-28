import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DrumPad } from "./DrumPad";

describe("DrumPad", () => {
  it("renders button with aria-label", () => {
    render(<DrumPad label="Kick" onTrigger={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Kick" });
    expect(button).toBeInTheDocument();
  });

  it("calls onTrigger on pointer down", () => {
    const onTrigger = vi.fn();
    render(<DrumPad label="Snare" onTrigger={onTrigger} />);
    fireEvent.pointerDown(screen.getByRole("button"));
    expect(onTrigger).toHaveBeenCalledOnce();
  });

  it("has aria-pressed true when active", () => {
    render(<DrumPad label="HiHat" active onTrigger={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("has aria-pressed false when not active", () => {
    render(<DrumPad label="HiHat" onTrigger={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("shows label text", () => {
    render(<DrumPad label="Clap" onTrigger={vi.fn()} />);
    expect(screen.getByText("Clap")).toBeInTheDocument();
  });

  it("triggers on Enter key", () => {
    const onTrigger = vi.fn();
    render(<DrumPad label="Kick" onTrigger={onTrigger} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onTrigger).toHaveBeenCalledOnce();
  });

  it("triggers on Space key", () => {
    const onTrigger = vi.fn();
    render(<DrumPad label="Kick" onTrigger={onTrigger} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onTrigger).toHaveBeenCalledOnce();
  });

  it("ignores non-primary pointer buttons", () => {
    const onTrigger = vi.fn();
    render(<DrumPad label="Kick" onTrigger={onTrigger} />);
    fireEvent.pointerDown(screen.getByRole("button"), { button: 2 });
    expect(onTrigger).not.toHaveBeenCalled();
  });
});
