import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClickToStart, ENGINE_TIMEOUT_MS } from "./ClickToStart";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function flushMicrotasks(): Promise<void> {
  return new Promise((r) => {
    queueMicrotask(r);
  });
}

describe("ClickToStart", () => {
  it("renders the overlay with BRUTALWAV title", () => {
    render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText("BRUTALWAV")).toBeInTheDocument();
    expect(screen.getByText("Click to start audio engine")).toBeInTheDocument();
  });

  it("renders a semantic button element", () => {
    render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });

  it("calls onStart when clicked", async () => {
    const onStart = vi.fn().mockResolvedValue(undefined);
    render(<ClickToStart onStart={onStart} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await flushMicrotasks();
    });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("shows error state when onStart rejects", async () => {
    const onStart = vi.fn().mockRejectedValue(new Error("engine failed"));
    render(<ClickToStart onStart={onStart} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await flushMicrotasks();
    });
    expect(
      screen.getByText("Failed to start audio engine. Click to retry."),
    ).toBeInTheDocument();
  });

  it("shows timeout error after ENGINE_TIMEOUT_MS", async () => {
    const neverResolves = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<ClickToStart onStart={neverResolves} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await flushMicrotasks();
    });
    expect(screen.getByText("Starting audio engine...")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ENGINE_TIMEOUT_MS);
    });
    expect(
      screen.getByText("Audio engine timed out. Click to retry."),
    ).toBeInTheDocument();
  });

  it("allows retry after error", async () => {
    const onStart = vi
      .fn()
      .mockRejectedValueOnce(new Error("first fail"))
      .mockResolvedValue(undefined);
    render(<ClickToStart onStart={onStart} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await flushMicrotasks();
    });
    expect(
      screen.getByText("Failed to start audio engine. Click to retry."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await flushMicrotasks();
    });
    expect(onStart).toHaveBeenCalledTimes(2);
  });
});
