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
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Step 8");
  });

  it("has current step visual indicator", () => {
    render(<StepButton active={false} current onToggle={vi.fn()} index={0} />);
    expect(screen.getByRole("button").className).toContain("current");
  });

  it("calls onArrowNav with 1 on ArrowRight", () => {
    const onArrowNav = vi.fn();
    render(
      <StepButton
        active={false}
        onToggle={vi.fn()}
        index={3}
        onArrowNav={onArrowNav}
      />,
    );
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowRight" });
    expect(onArrowNav).toHaveBeenCalledWith(1);
  });

  it("calls onArrowNav with -1 on ArrowLeft", () => {
    const onArrowNav = vi.fn();
    render(
      <StepButton
        active={false}
        onToggle={vi.fn()}
        index={3}
        onArrowNav={onArrowNav}
      />,
    );
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowLeft" });
    expect(onArrowNav).toHaveBeenCalledWith(-1);
  });

  it("supports tabIndex prop", () => {
    render(
      <StepButton active={false} onToggle={vi.fn()} index={0} tabIndex={-1} />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("tabindex", "-1");
  });

  it("forwards ref", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <StepButton ref={ref} active={false} onToggle={vi.fn()} index={0} />,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
