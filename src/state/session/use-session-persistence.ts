import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDawStore } from "@state/store";
import type { SessionStorage } from "./session-storage";
import { createSaveQueue } from "./save-queue";
import { createAutoSave } from "./auto-save";
import { recoverSession } from "./session-recovery";
import { SESSION_VERSION } from "./session-schema";
import type { SessionSchema } from "./session-schema";

// Stored meta from the loaded session, preserved across auto-saves
let sessionMeta: { name: string; createdAt: number } = {
  name: "Untitled",
  createdAt: Date.now(),
};

function storeToSession(): SessionSchema {
  const state = useDawStore.getState();
  return {
    version: SESSION_VERSION,
    meta: {
      name: sessionMeta.name,
      createdAt: sessionMeta.createdAt,
      updatedAt: Date.now(),
    },
    transport: {
      bpm: state.bpm,
      loopEnabled: state.loopEnabled,
      loopStart: state.loopStart,
      loopEnd: state.loopEnd,
    },
    tracks: state.tracks.map((t) => ({ ...t })),
    clips: Object.values(state.clips),
    mixer: { masterVolume: 1 },
  };
}

export function hydrateStore(session: SessionSchema): void {
  sessionMeta = {
    name: session.meta.name,
    createdAt: session.meta.createdAt,
  };
  const clips: Record<string, (typeof session.clips)[number]> = {};
  for (const clip of session.clips) {
    clips[clip.id] = clip;
  }

  useDawStore.setState({
    bpm: session.transport.bpm,
    loopEnabled: session.transport.loopEnabled,
    loopStart: session.transport.loopStart,
    loopEnd: session.transport.loopEnd,
    tracks: session.tracks,
    clips,
  });
}

type SessionPersistenceResult = {
  saving: boolean;
  dirty: boolean;
  saveNow: () => Promise<void>;
  recoveryWarnings: string[];
};

export function useSessionPersistence(
  storage: SessionStorage,
): SessionPersistenceResult {
  const [recoveryWarnings, setRecoveryWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);

  const saveQueue = useMemo(() => createSaveQueue(storage), [storage]);

  const autoSave = useMemo(
    () => createAutoSave(() => JSON.stringify(storeToSession()), saveQueue),
    [saveQueue],
  );

  // Load session from storage on mount (draft-first for crash safety)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    void (async (): Promise<void> => {
      // Check draft first — a crash between putDraft and putCurrent
      // means the draft is the most recent write attempt
      const draft = await storage.getDraft();
      const raw = draft ?? (await storage.getCurrent());
      if (raw !== undefined) {
        const result = recoverSession(raw);
        hydrateStore(result.session);
        if (draft !== undefined) {
          result.warnings.push(
            "Recovered from unsaved draft (possible crash recovery)",
          );
        }
        if (result.warnings.length > 0) {
          setRecoveryWarnings(result.warnings);
        }
      }
    })();
  }, [storage]);

  // Start auto-save and subscribe to store changes
  useEffect(() => {
    autoSave.start();

    const unsub = useDawStore.subscribe(() => {
      autoSave.notifyChange();
    });

    return () => {
      autoSave.stop();
      unsub();
    };
  }, [autoSave]);

  const saveNow = useCallback(async (): Promise<void> => {
    setSaving(true);
    await autoSave.saveNow();
    await saveQueue.flush();
    setSaving(false);
  }, [autoSave, saveQueue]);

  return {
    saving,
    dirty: autoSave.dirty,
    saveNow,
    recoveryWarnings,
  };
}
