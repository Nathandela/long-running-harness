import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClickToStart } from "./ClickToStart";

describe("ClickToStart", () => {
  it("renders the overlay with BRUTALWAV title", () => {
    render(<ClickToStart onStart={vi.fn()} />);
    expect(screen.getByText("BRUTALWAV")).toBeInTheDocument();
    expect(screen.getByText("Click to start audio engine")).toBeInTheDocument();
  });

  it("calls onStart when clicked", () => {
    const onStart = vi.fn();
    render(<ClickToStart onStart={onStart} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("calls onStart on Enter key", () => {
    const onStart = vi.fn();
    render(<ClickToStart onStart={onStart} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("calls onStart on Space key", () => {
    const onStart = vi.fn();
    render(<ClickToStart onStart={onStart} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(onStart).toHaveBeenCalledOnce();
  });
});
