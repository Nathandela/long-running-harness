import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StepButton } from "./StepButton";

describe("StepButton", () => {
  it("renders button", () => {
    render(<StepButton active={false} onToggle={vi.fn()} index={0} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has aria-pressed matching active prop", () => {
    const { rerender } = render(
      <StepButton active={false} onToggle={vi.fn()} index={0} />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(<StepButton active={true} onToggle={vi.fn()} index={0} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onToggle on click", () => {
    const onToggle = vi.fn();
    render(<StepButton active={false} onToggle={onToggle} index={3} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("has aria-label with step number", () => {
    render(<StepButton active={false} onToggle={vi.fn()} index={7} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Step 8",
    );
  });

  it("has current step visual indicator", () => {
    render(
      <StepButton active={false} current onToggle={vi.fn()} index={0} />,
    );
    expect(screen.getByRole("button").className).toContain("current");
  });
});
