import { describe, it, expect } from "vitest";
import { createInMemorySessionStorage } from "./session-storage";

describe("SessionStorage (in-memory)", () => {
  it("returns undefined for missing draft", async () => {
    const storage = createInMemorySessionStorage();
    expect(await storage.getDraft()).toBeUndefined();
  });

  it("round-trips draft", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putDraft('{"version":1}');
    expect(await storage.getDraft()).toBe('{"version":1}');
  });

  it("deletes draft", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putDraft("data");
    await storage.deleteDraft();
    expect(await storage.getDraft()).toBeUndefined();
  });

  it("round-trips current", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putCurrent("session-data");
    expect(await storage.getCurrent()).toBe("session-data");
  });

  it("round-trips backup", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putBackup("backup-data");
    expect(await storage.getBackup()).toBe("backup-data");
  });

  describe("saved sessions", () => {
    it("lists empty when no sessions saved", async () => {
      const storage = createInMemorySessionStorage();
      expect(await storage.listSessions()).toEqual([]);
    });

    it("saves and lists a session", async () => {
      const storage = createInMemorySessionStorage();
      await storage.putSession("s1", "My Song", "data");
      const list = await storage.listSessions();
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe("s1");
      expect(list[0]?.name).toBe("My Song");
    });

    it("retrieves a saved session", async () => {
      const storage = createInMemorySessionStorage();
      await storage.putSession("s1", "My Song", "data");
      expect(await storage.getSession("s1")).toBe("data");
    });

    it("returns undefined for missing session", async () => {
      const storage = createInMemorySessionStorage();
      expect(await storage.getSession("nope")).toBeUndefined();
    });

    it("deletes a session", async () => {
      const storage = createInMemorySessionStorage();
      await storage.putSession("s1", "My Song", "data");
      await storage.deleteSession("s1");
      expect(await storage.listSessions()).toEqual([]);
      expect(await storage.getSession("s1")).toBeUndefined();
    });

    it("renames a session", async () => {
      const storage = createInMemorySessionStorage();
      await storage.putSession("s1", "Old Name", "data");
      await storage.renameSession("s1", "New Name");
      const list = await storage.listSessions();
      expect(list[0]?.name).toBe("New Name");
    });
  });
});
