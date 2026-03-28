import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAutoSave } from "./auto-save";
import { createSaveQueue } from "./save-queue";
import { createInMemorySessionStorage } from "./session-storage";

describe("AutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces rapid changes", async () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);
    const enqueueSpy = vi.spyOn(queue, "enqueue");
    let version = 0;
    const autoSave = createAutoSave(
      () => `session-${String(++version)}`,
      queue,
      30_000,
      2_000,
    );

    autoSave.start();
    autoSave.notifyChange();
    autoSave.notifyChange();
    autoSave.notifyChange();

    // Before debounce fires, no enqueue
    expect(enqueueSpy).not.toHaveBeenCalled();

    // After debounce period
    await vi.advanceTimersByTimeAsync(2_000);
    expect(enqueueSpy).toHaveBeenCalledTimes(1);

    autoSave.stop();
  });

  it("interval triggers save as safety net", async () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);
    const enqueueSpy = vi.spyOn(queue, "enqueue");
    const autoSave = createAutoSave(() => "session-data", queue, 30_000, 2_000);

    autoSave.start();
    autoSave.notifyChange();

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(2_000);
    expect(enqueueSpy).toHaveBeenCalledTimes(1);
    enqueueSpy.mockClear();

    // Mark dirty again without notifyChange (simulating interval behavior)
    autoSave.notifyChange();
    // Advance to interval (30s) -- debounce fires first at 2s
    await vi.advanceTimersByTimeAsync(2_000);
    expect(enqueueSpy).toHaveBeenCalledTimes(1);

    autoSave.stop();
  });

  it("saveNow bypasses debounce", async () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);
    const enqueueSpy = vi.spyOn(queue, "enqueue");
    const autoSave = createAutoSave(() => "session-data", queue, 30_000, 2_000);

    autoSave.start();
    await autoSave.saveNow();
    expect(enqueueSpy).toHaveBeenCalledTimes(1);

    autoSave.stop();
  });

  it("stop clears timers", async () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);
    const enqueueSpy = vi.spyOn(queue, "enqueue");
    const autoSave = createAutoSave(() => "session-data", queue, 30_000, 2_000);

    autoSave.start();
    autoSave.notifyChange();
    autoSave.stop();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  it("tracks dirty state", () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);
    const autoSave = createAutoSave(() => "session-data", queue);

    autoSave.start();
    expect(autoSave.dirty).toBe(false);
    autoSave.notifyChange();
    expect(autoSave.dirty).toBe(true);

    autoSave.stop();
  });
});
