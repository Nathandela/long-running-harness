import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClickToStart, ENGINE_TIMEOUT_MS } from "./ClickToStart";

// Store the original matchMedia mock from setup.ts so we can restore it
const originalMatchMedia = window.matchMedia;

type ChangeListener = (e: { matches: boolean }) => void;

function mockMatchMedia(matches: boolean): {
  triggerChange: (newMatches: boolean) => void;
} {
  const listeners: ChangeListener[] = [];
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn((_event: string, cb: ChangeListener) => {
        listeners.push(cb);
      }),
      removeEventListener: vi.fn((_event: string, cb: ChangeListener) => {
        const idx = listeners.indexOf(cb);
        if (idx >= 0) listeners.splice(idx, 1);
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  });
  return {
    triggerChange(newMatches: boolean) {
      for (const fn of [...listeners]) fn({ matches: newMatches });
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  // Restore the global matchMedia mock from setup.ts
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: originalMatchMedia,
  });
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

  it("shows mobile warning when matchMedia reports narrow viewport", () => {
    mockMatchMedia(true);
    render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);
    const notice = screen.getByText(/best experienced on desktop/i);
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveAttribute("role", "note");
  });

  it("hides mobile warning when matchMedia reports wide viewport", () => {
    mockMatchMedia(false);
    render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);
    expect(
      screen.queryByText(/best experienced on desktop/i),
    ).not.toBeInTheDocument();
  });

  it("reacts to matchMedia change events", () => {
    const { triggerChange } = mockMatchMedia(false);
    render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);
    expect(
      screen.queryByText(/best experienced on desktop/i),
    ).not.toBeInTheDocument();

    act(() => {
      triggerChange(true);
    });
    expect(
      screen.getByText(/best experienced on desktop/i),
    ).toBeInTheDocument();

    act(() => {
      triggerChange(false);
    });
    expect(
      screen.queryByText(/best experienced on desktop/i),
    ).not.toBeInTheDocument();
  });

  it("cleans up matchMedia listener on unmount", () => {
    mockMatchMedia(false);
    const { unmount } = render(
      <ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />,
    );
    // matchMedia is called twice: once in useState initializer, once in useEffect
    const mockFn = window.matchMedia as ReturnType<typeof vi.fn>;
    const lastResult = mockFn.mock.results.at(-1);
    if (!lastResult) throw new Error("matchMedia was never called");
    const mql = lastResult.value as {
      removeEventListener: ReturnType<typeof vi.fn>;
    };
    expect(mql.removeEventListener).not.toHaveBeenCalled();
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
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
