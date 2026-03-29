import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClickToStart } from "./ClickToStart";

describe("ClickToStart", () => {
  it("renders the overlay with BRUTALWAV title", () => {
    render(<ClickToStart onStart={vi.fn()} />);
    expect(screen.getByText("BRUTALWAV")).toBeInTheDocument();
    expect(screen.getByText("Click to start audio engine")).toBeInTheDocument();
  });

  it("renders a semantic button element", () => {
    render(<ClickToStart onStart={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });

  it("calls onStart when clicked", () => {
    const onStart = vi.fn();
    render(<ClickToStart onStart={onStart} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
