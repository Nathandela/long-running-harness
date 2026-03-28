import { describe, it, expect, vi } from "vitest";
import { createSaveQueue } from "./save-queue";
import {
  createInMemorySessionStorage,
  type SessionStorage,
} from "./session-storage";

describe("SaveQueue", () => {
  it("saves via draft-then-swap pattern", async () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);
    await queue.enqueue("session-1");
    await queue.flush();

    expect(await storage.getCurrent()).toBe("session-1");
    // Draft should be cleaned up after successful save
    expect(await storage.getDraft()).toBeUndefined();
  });

  it("backs up previous current before overwriting", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putCurrent("old-session");
    const queue = createSaveQueue(storage);
    await queue.enqueue("new-session");
    await queue.flush();

    expect(await storage.getCurrent()).toBe("new-session");
    expect(await storage.getBackup()).toBe("old-session");
  });

  it("coalesces rapid enqueues", async () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);

    // Enqueue several without waiting
    void queue.enqueue("v1");
    void queue.enqueue("v2");
    void queue.enqueue("v3");
    await queue.flush();

    // The final current should be the last enqueued value
    expect(await storage.getCurrent()).toBe("v3");
  });

  it("does not roll back to stale queued value after failed save", async () => {
    const storage = createInMemorySessionStorage();
    let failNext = true;
    const failingStorage: SessionStorage = {
      ...storage,
      putDraft: vi.fn(async (json: string) => {
        if (failNext) {
          throw new Error("simulated write failure");
        }
        return storage.putDraft(json);
      }),
    };
    const queue = createSaveQueue(failingStorage);

    // enqueue A (will fail), then B queues behind it
    const p = queue.enqueue("A");
    void queue.enqueue("B");

    await expect(p).rejects.toThrow("simulated write failure");

    // Allow writes to succeed now
    failNext = false;

    // enqueue C — should be the final stored value
    await queue.enqueue("C");
    await queue.flush();

    expect(await storage.getCurrent()).toBe("C");
  });

  it("reports pending state", async () => {
    const storage = createInMemorySessionStorage();
    const queue = createSaveQueue(storage);
    expect(queue.pending).toBe(false);
    const p = queue.enqueue("data");
    // pending may be true during the write
    await p;
    await queue.flush();
    expect(queue.pending).toBe(false);
  });
});
