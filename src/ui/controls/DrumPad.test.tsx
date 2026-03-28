import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DrumPad } from "./DrumPad";

describe("DrumPad", () => {
  it("renders button with aria-label", () => {
    render(<DrumPad label="Kick" onTrigger={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Kick" });
    expect(button).toBeInTheDocument();
  });

  it("calls onTrigger on click", () => {
    const onTrigger = vi.fn();
    render(<DrumPad label="Snare" onTrigger={onTrigger} />);
    fireEvent.click(screen.getByRole("button"));
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
});
