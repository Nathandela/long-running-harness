import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDawStore } from "@state/store";
import type { SessionStorage } from "./session-storage";
import { createSaveQueue } from "./save-queue";
import { createAutoSave } from "./auto-save";
import { recoverSession } from "./session-recovery";
import { SESSION_VERSION } from "./session-schema";
import type { SessionSchema } from "./session-schema";

function storeToSession(): SessionSchema {
  const state = useDawStore.getState();
  const now = Date.now();
  return {
    version: SESSION_VERSION,
    meta: { name: "Untitled", createdAt: now, updatedAt: now },
    transport: {
      bpm: state.bpm,
      loopEnabled: state.loopEnabled,
      loopStart: state.loopStart,
      loopEnd: state.loopEnd,
    },
    tracks: [],
    mixer: { masterVolume: 1 },
  };
}

function hydrateStore(session: SessionSchema): void {
  useDawStore.setState({
    bpm: session.transport.bpm,
    loopEnabled: session.transport.loopEnabled,
    loopStart: session.transport.loopStart,
    loopEnd: session.transport.loopEnd,
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

  // Load session from storage on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    void (async (): Promise<void> => {
      const raw = await storage.getCurrent();
      if (raw !== undefined) {
        const result = recoverSession(raw);
        hydrateStore(result.session);
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
