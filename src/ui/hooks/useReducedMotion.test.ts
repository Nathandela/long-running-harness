import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  onchange: null;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
}

function mockMatchMedia(matches: boolean): {
  trigger: (matches: boolean) => void;
  mql: MockMediaQueryList;
} {
  let listener: ((e: { matches: boolean }) => void) | null = null;
  const mql: MockMediaQueryList = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(
      (_: string, cb: (e: { matches: boolean }) => void) => {
        listener = cb;
      },
    ),
    removeEventListener: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((_query: string) => mql),
  });
  return {
    trigger: (newMatches: boolean): void => {
      if (listener !== null) listener({ matches: newMatches });
    },
    mql,
  };
}

describe("useReducedMotion", () => {
  it("returns false when no preference is set", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when reduced motion is preferred", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when preference changes", () => {
    const { trigger } = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      trigger(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      trigger(false);
    });
    expect(result.current).toBe(false);
  });

  it("cleans up listener on unmount", () => {
    const { mql } = mockMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
