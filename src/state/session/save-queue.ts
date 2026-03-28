import type { SessionStorage } from "./session-storage";

export type SaveQueue = {
  enqueue(sessionJson: string): Promise<void>;
  flush(): Promise<void>;
  readonly pending: boolean;
};

export function createSaveQueue(storage: SessionStorage): SaveQueue {
  let inflight: Promise<void> | null = null;
  let queued: string | null = null;

  async function doSave(json: string): Promise<void> {
    const previous = await storage.getCurrent();
    await storage.putDraft(json);
    await storage.putCurrent(json);
    if (previous !== undefined) {
      await storage.putBackup(previous);
    }
    await storage.deleteDraft();
  }

  async function processQueue(): Promise<void> {
    while (queued !== null) {
      const next = queued;
      queued = null;
      await doSave(next);
    }
  }

  return {
    enqueue(sessionJson: string): Promise<void> {
      if (inflight !== null) {
        queued = sessionJson;
        return inflight;
      }
      inflight = (async () => {
        try {
          await doSave(sessionJson);
          await processQueue();
        } finally {
          inflight = null;
        }
      })();
      return inflight;
    },

    async flush(): Promise<void> {
      if (inflight !== null) {
        await inflight;
      }
    },

    get pending(): boolean {
      return inflight !== null;
    },
  };
}
