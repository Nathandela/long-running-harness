import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UndoToast } from "./UndoToast";

describe("UndoToast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when pending is null", () => {
    render(<UndoToast pending={null} onExpired={vi.fn()} />);
    expect(screen.queryByTestId("undo-toast")).not.toBeInTheDocument();
  });

  it("renders toast with message when pending is set", () => {
    render(
      <UndoToast
        pending={{ message: "Removed effect.", onUndo: vi.fn() }}
        onExpired={vi.fn()}
      />,
    );
    expect(screen.getByTestId("undo-toast")).toBeInTheDocument();
    expect(screen.getByText("Removed effect.")).toBeInTheDocument();
  });

  it("renders undo button", () => {
    render(
      <UndoToast
        pending={{ message: "Removed.", onUndo: vi.fn() }}
        onExpired={vi.fn()}
      />,
    );
    expect(screen.getByTestId("undo-btn")).toBeInTheDocument();
  });

  it("calls onUndo when undo button is clicked", async () => {
    const onUndo = vi.fn();
    render(
      <UndoToast
        pending={{ message: "Removed.", onUndo }}
        onExpired={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId("undo-btn"));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("calls onExpired after 5 seconds", () => {
    vi.useFakeTimers();
    const onExpired = vi.fn();
    render(
      <UndoToast
        pending={{ message: "Removed.", onUndo: vi.fn() }}
        onExpired={onExpired}
      />,
    );
    expect(onExpired).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it("does not call onExpired if undo is clicked before timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onExpired = vi.fn();
    const onUndo = vi.fn();
    render(
      <UndoToast
        pending={{ message: "Removed.", onUndo }}
        onExpired={onExpired}
      />,
    );
    await userEvent
      .setup({ advanceTimers: vi.advanceTimersByTime })
      .click(screen.getByTestId("undo-btn"));
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(onExpired).not.toHaveBeenCalled();
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("has role=status and aria-live=polite for screen readers", () => {
    render(
      <UndoToast
        pending={{ message: "Removed.", onUndo: vi.fn() }}
        onExpired={vi.fn()}
      />,
    );
    const toast = screen.getByTestId("undo-toast");
    expect(toast).toHaveAttribute("role", "status");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });
});
