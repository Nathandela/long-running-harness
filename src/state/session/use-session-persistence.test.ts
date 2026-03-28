import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createInMemorySessionStorage } from "./session-storage";
import { createDefaultSession } from "./session-schema";
import { useSessionPersistence } from "./use-session-persistence";
import { useDawStore } from "@state/store";

describe("useSessionPersistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDawStore.setState({
      transportState: "stopped",
      bpm: 120,
      cursorSeconds: 0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      engineStatus: "uninitialized",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads session from storage on mount", async () => {
    const storage = createInMemorySessionStorage();
    const session = createDefaultSession();
    session.transport.bpm = 140;
    await storage.putCurrent(JSON.stringify(session));

    renderHook(() => useSessionPersistence(storage));

    // Allow async loading
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(useDawStore.getState().bpm).toBe(140);
  });

  it("returns recovery warnings for corrupt session", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putCurrent('{"version":1,"transport":"broken"}');

    const { result } = renderHook(() => useSessionPersistence(storage));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.recoveryWarnings.length).toBeGreaterThan(0);
  });

  it("saveNow persists current store state", async () => {
    const storage = createInMemorySessionStorage();
    const { result } = renderHook(() => useSessionPersistence(storage));

    useDawStore.getState().setBpm(160);

    await act(async () => {
      await result.current.saveNow();
    });

    const saved = await storage.getCurrent();
    expect(saved).toBeDefined();
    if (saved === undefined) return;
    const parsed = JSON.parse(saved) as { transport: { bpm: number } };
    expect(parsed.transport.bpm).toBe(160);
  });

  it("auto-saves after debounce on store change", async () => {
    const storage = createInMemorySessionStorage();
    renderHook(() => useSessionPersistence(storage));

    act(() => {
      useDawStore.getState().setBpm(150);
    });

    // Before debounce
    expect(await storage.getCurrent()).toBeUndefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    const saved = await storage.getCurrent();
    expect(saved).toBeDefined();
  });
});
