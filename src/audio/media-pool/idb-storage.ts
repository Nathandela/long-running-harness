import type { AudioSourceHandle, WaveformPeaks } from "./types";

/** Storage interface for media pool persistence. */
export type MediaPoolStorage = {
  putBlob(id: string, blob: Blob): Promise<void>;
  getBlob(id: string): Promise<Blob | undefined>;
  deleteBlob(id: string): Promise<void>;
  putMeta(id: string, meta: AudioSourceHandle): Promise<void>;
  getMeta(id: string): Promise<AudioSourceHandle | undefined>;
  getAllMeta(): Promise<AudioSourceHandle[]>;
  deleteMeta(id: string): Promise<void>;
  putPeaks(key: string, peaks: WaveformPeaks): Promise<void>;
  getPeaks(key: string): Promise<WaveformPeaks | undefined>;
  deletePeaksBySource(sourceId: string): Promise<void>;
};

/** In-memory implementation for testing. */
export function createInMemoryStorage(): MediaPoolStorage {
  const blobs = new Map<string, Blob>();
  const meta = new Map<string, AudioSourceHandle>();
  const peaks = new Map<string, WaveformPeaks>();

  return {
    putBlob(id, blob): Promise<void> {
      blobs.set(id, blob);
      return Promise.resolve();
    },
    getBlob(id): Promise<Blob | undefined> {
      return Promise.resolve(blobs.get(id));
    },
    deleteBlob(id): Promise<void> {
      blobs.delete(id);
      return Promise.resolve();
    },
    putMeta(id, handle): Promise<void> {
      meta.set(id, handle);
      return Promise.resolve();
    },
    getMeta(id): Promise<AudioSourceHandle | undefined> {
      return Promise.resolve(meta.get(id));
    },
    getAllMeta(): Promise<AudioSourceHandle[]> {
      return Promise.resolve([...meta.values()]);
    },
    deleteMeta(id): Promise<void> {
      meta.delete(id);
      return Promise.resolve();
    },
    putPeaks(key, data): Promise<void> {
      peaks.set(key, data);
      return Promise.resolve();
    },
    getPeaks(key): Promise<WaveformPeaks | undefined> {
      return Promise.resolve(peaks.get(key));
    },
    deletePeaksBySource(sourceId): Promise<void> {
      for (const key of [...peaks.keys()]) {
        if (key.startsWith(`${sourceId}:`)) {
          peaks.delete(key);
        }
      }
      return Promise.resolve();
    },
  };
}

const DB_NAME = "brutalwav-media";
const DB_VERSION = 1;
const STORE_BLOBS = "blobs";
const STORE_META = "meta";
const STORE_PEAKS = "peaks";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (): void => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
      if (!db.objectStoreNames.contains(STORE_PEAKS)) {
        db.createObjectStore(STORE_PEAKS);
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
      reject(tx.error ?? new Error("IndexedDB put failed"));
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
      reject(req.error ?? new Error("IndexedDB get failed"));
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
      reject(tx.error ?? new Error("IndexedDB delete failed"));
    };
  });
}

function idbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = (): void => {
      resolve(req.result as T[]);
    };
    req.onerror = (): void => {
      reject(req.error ?? new Error("IndexedDB getAll failed"));
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
      reject(req.error ?? new Error("IndexedDB getAllKeys failed"));
    };
  });
}

/** IndexedDB-backed storage for production use. */
export function createIndexedDBStorage(): MediaPoolStorage {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function getDb(): Promise<IDBDatabase> {
    if (dbPromise === null) {
      dbPromise = openDb();
    }
    return dbPromise;
  }

  return {
    async putBlob(id, blob): Promise<void> {
      const db = await getDb();
      await idbPut(db, STORE_BLOBS, id, blob);
    },
    async getBlob(id): Promise<Blob | undefined> {
      const db = await getDb();
      return idbGet<Blob>(db, STORE_BLOBS, id);
    },
    async deleteBlob(id): Promise<void> {
      const db = await getDb();
      await idbDelete(db, STORE_BLOBS, id);
    },
    async putMeta(id, handle): Promise<void> {
      const db = await getDb();
      await idbPut(db, STORE_META, id, handle);
    },
    async getMeta(id): Promise<AudioSourceHandle | undefined> {
      const db = await getDb();
      return idbGet<AudioSourceHandle>(db, STORE_META, id);
    },
    async getAllMeta(): Promise<AudioSourceHandle[]> {
      const db = await getDb();
      return idbGetAll<AudioSourceHandle>(db, STORE_META);
    },
    async deleteMeta(id): Promise<void> {
      const db = await getDb();
      await idbDelete(db, STORE_META, id);
    },
    async putPeaks(key, data): Promise<void> {
      const db = await getDb();
      await idbPut(db, STORE_PEAKS, key, data);
    },
    async getPeaks(key): Promise<WaveformPeaks | undefined> {
      const db = await getDb();
      return idbGet<WaveformPeaks>(db, STORE_PEAKS, key);
    },
    async deletePeaksBySource(sourceId): Promise<void> {
      const db = await getDb();
      const keys = await idbGetAllKeys(db, STORE_PEAKS);
      for (const key of keys) {
        if (key.startsWith(`${sourceId}:`)) {
          await idbDelete(db, STORE_PEAKS, key);
        }
      }
    },
  };
}
