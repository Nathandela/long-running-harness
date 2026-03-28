export type SessionListEntry = {
  id: string;
  name: string;
  updatedAt: number;
};

export type SessionStorage = {
  getDraft(): Promise<string | undefined>;
  putDraft(json: string): Promise<void>;
  deleteDraft(): Promise<void>;
  getCurrent(): Promise<string | undefined>;
  putCurrent(json: string): Promise<void>;
  getBackup(): Promise<string | undefined>;
  putBackup(json: string): Promise<void>;
  listSessions(): Promise<SessionListEntry[]>;
  getSession(id: string): Promise<string | undefined>;
  putSession(id: string, name: string, json: string): Promise<void>;
  deleteSession(id: string): Promise<void>;
  renameSession(id: string, name: string): Promise<void>;
};

export function createInMemorySessionStorage(): SessionStorage {
  const active = new Map<string, string>();
  const saved = new Map<
    string,
    { name: string; json: string; updatedAt: number }
  >();

  return {
    getDraft(): Promise<string | undefined> {
      return Promise.resolve(active.get("draft"));
    },
    putDraft(json): Promise<void> {
      active.set("draft", json);
      return Promise.resolve();
    },
    deleteDraft(): Promise<void> {
      active.delete("draft");
      return Promise.resolve();
    },
    getCurrent(): Promise<string | undefined> {
      return Promise.resolve(active.get("current"));
    },
    putCurrent(json): Promise<void> {
      active.set("current", json);
      return Promise.resolve();
    },
    getBackup(): Promise<string | undefined> {
      return Promise.resolve(active.get("backup"));
    },
    putBackup(json): Promise<void> {
      active.set("backup", json);
      return Promise.resolve();
    },
    listSessions(): Promise<SessionListEntry[]> {
      return Promise.resolve(
        [...saved.entries()].map(([id, entry]) => ({
          id,
          name: entry.name,
          updatedAt: entry.updatedAt,
        })),
      );
    },
    getSession(id): Promise<string | undefined> {
      return Promise.resolve(saved.get(id)?.json);
    },
    putSession(id, name, json): Promise<void> {
      saved.set(id, { name, json, updatedAt: Date.now() });
      return Promise.resolve();
    },
    deleteSession(id): Promise<void> {
      saved.delete(id);
      return Promise.resolve();
    },
    renameSession(id, name): Promise<void> {
      const entry = saved.get(id);
      if (entry !== undefined) {
        entry.name = name;
      }
      return Promise.resolve();
    },
  };
}

const DB_NAME = "brutalwav-sessions";
const DB_VERSION = 1;
const STORE_ACTIVE = "active";
const STORE_SAVED = "saved";

function openSessionDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (): void => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
        db.createObjectStore(STORE_ACTIVE);
      }
      if (!db.objectStoreNames.contains(STORE_SAVED)) {
        db.createObjectStore(STORE_SAVED);
      }
    };
    req.onsuccess = (): void => {
      resolve(req.result);
    };
    req.onerror = (): void => {
      reject(req.error ?? new Error("IndexedDB open failed"));
    };
  });
}

function idbPut(
  db: IDBDatabase,
  store: string,
  key: string,
  value: unknown,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = (): void => {
      resolve();
    };
    tx.onerror = (): void => {
      reject(tx.error ?? new Error("IDB put failed"));
    };
  });
}

function idbGet<T>(
  db: IDBDatabase,
  store: string,
  key: string,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = (): void => {
      resolve(req.result as T | undefined);
    };
    req.onerror = (): void => {
      reject(req.error ?? new Error("IDB get failed"));
    };
  });
}

function idbDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = (): void => {
      resolve();
    };
    tx.onerror = (): void => {
      reject(tx.error ?? new Error("IDB delete failed"));
    };
  });
}

function idbGetAllKeys(db: IDBDatabase, store: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAllKeys();
    req.onsuccess = (): void => {
      resolve(req.result as string[]);
    };
    req.onerror = (): void => {
      reject(req.error ?? new Error("IDB getAllKeys failed"));
    };
  });
}

export function createIndexedDBSessionStorage(): SessionStorage {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function getDb(): Promise<IDBDatabase> {
    if (dbPromise === null) {
      dbPromise = openSessionDb();
    }
    return dbPromise;
  }

  return {
    async getDraft(): Promise<string | undefined> {
      const db = await getDb();
      return idbGet<string>(db, STORE_ACTIVE, "draft");
    },
    async putDraft(json): Promise<void> {
      const db = await getDb();
      await idbPut(db, STORE_ACTIVE, "draft", json);
    },
    async deleteDraft(): Promise<void> {
      const db = await getDb();
      await idbDelete(db, STORE_ACTIVE, "draft");
    },
    async getCurrent(): Promise<string | undefined> {
      const db = await getDb();
      return idbGet<string>(db, STORE_ACTIVE, "current");
    },
    async putCurrent(json): Promise<void> {
      const db = await getDb();
      await idbPut(db, STORE_ACTIVE, "current", json);
    },
    async getBackup(): Promise<string | undefined> {
      const db = await getDb();
      return idbGet<string>(db, STORE_ACTIVE, "backup");
    },
    async putBackup(json): Promise<void> {
      const db = await getDb();
      await idbPut(db, STORE_ACTIVE, "backup", json);
    },
    async listSessions(): Promise<SessionListEntry[]> {
      const db = await getDb();
      const keys = await idbGetAllKeys(db, STORE_SAVED);
      const entries: SessionListEntry[] = [];
      for (const key of keys) {
        const entry = await idbGet<{
          name: string;
          json: string;
          updatedAt: number;
        }>(db, STORE_SAVED, key);
        if (entry !== undefined) {
          entries.push({
            id: key,
            name: entry.name,
            updatedAt: entry.updatedAt,
          });
        }
      }
      return entries;
    },
    async getSession(id): Promise<string | undefined> {
      const db = await getDb();
      const entry = await idbGet<{
        name: string;
        json: string;
        updatedAt: number;
      }>(db, STORE_SAVED, id);
      return entry?.json;
    },
    async putSession(id, name, json): Promise<void> {
      const db = await getDb();
      await idbPut(db, STORE_SAVED, id, { name, json, updatedAt: Date.now() });
    },
    async deleteSession(id): Promise<void> {
      const db = await getDb();
      await idbDelete(db, STORE_SAVED, id);
    },
    async renameSession(id, name): Promise<void> {
      const db = await getDb();
      const entry = await idbGet<{
        name: string;
        json: string;
        updatedAt: number;
      }>(db, STORE_SAVED, id);
      if (entry !== undefined) {
        entry.name = name;
        await idbPut(db, STORE_SAVED, id, entry);
      }
    },
  };
}
