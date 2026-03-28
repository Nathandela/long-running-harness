import type { SaveQueue } from "./save-queue";

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_DEBOUNCE_MS = 2_000;

export type AutoSave = {
  start(): void;
  stop(): void;
  notifyChange(): void;
  saveNow(): Promise<void>;
  readonly dirty: boolean;
};

export function createAutoSave(
  getSessionJson: () => string,
  saveQueue: SaveQueue,
  intervalMs: number = DEFAULT_INTERVAL_MS,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): AutoSave {
  let isDirty = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let intervalTimer: ReturnType<typeof setInterval> | null = null;

  function save(): void {
    if (!isDirty) return;
    isDirty = false;
    void saveQueue.enqueue(getSessionJson());
  }

  return {
    start(): void {
      intervalTimer = setInterval(() => {
        save();
      }, intervalMs);
    },

    stop(): void {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (intervalTimer !== null) {
        clearInterval(intervalTimer);
        intervalTimer = null;
      }
    },

    notifyChange(): void {
      isDirty = true;
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        save();
      }, debounceMs);
    },

    async saveNow(): Promise<void> {
      isDirty = false;
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      await saveQueue.enqueue(getSessionJson());
    },

    get dirty(): boolean {
      return isDirty;
    },
  };
}
