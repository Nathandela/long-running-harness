import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isCrossOriginIsolated,
  createAudioEngine,
  createMediaPool,
  createIndexedDBStorage,
  type AudioEngineContext,
  type MediaPool,
} from "@audio/index";
import { AudioEngineProvider } from "@audio/audio-engine-provider";
import { MediaPoolProvider } from "@audio/media-pool/media-pool-provider";
import { CrossOriginError, ClickToStart, DawShell } from "@ui/index";
import { ErrorBoundary } from "@ui/ErrorBoundary";
import { useDawStore } from "@state/index";
import { createIndexedDBSessionStorage } from "@state/session/index";

export function App(): React.JSX.Element {
  const crossOriginOk = isCrossOriginIsolated();
  const [engine, setEngine] = useState<AudioEngineContext | null>(null);
  const [pool, setPool] = useState<MediaPool | null>(null);
  const [idbWarning, setIdbWarning] = useState(false);
  const engineRef = useRef<AudioEngineContext | null>(null);
  const setEngineStatus = useDawStore((s) => s.setEngineStatus);
  const sessionStorage = useMemo(() => createIndexedDBSessionStorage(), []);

  useEffect(() => {
    if (engine === null) return;
    const storage = createIndexedDBStorage();
    const p = createMediaPool(engine.ctx, storage);
    let cancelled = false;
    p.init().then(
      () => {
        if (!cancelled) setPool(p);
      },
      () => {
        // IDB init failed -- pool works but starts empty
        if (!cancelled) {
          setPool(p);
          setIdbWarning(true);
        }
      },
    );
    return () => {
      cancelled = true;
      setPool(null);
    };
  }, [engine]);

  const handleStart = useCallback(async (): Promise<void> => {
    if (engineRef.current) return;

    let newEngine: AudioEngineContext;
    try {
      newEngine = createAudioEngine();
    } catch {
      setEngineStatus("error");
      throw new Error("Failed to create audio engine");
    }

    engineRef.current = newEngine;
    try {
      await newEngine.resume();
      if (engineRef.current !== newEngine) return;
      setEngineStatus("running");
      setEngine(newEngine);
    } catch {
      void newEngine.close();
      if (engineRef.current === newEngine) {
        engineRef.current = null;
      }
      setEngineStatus("error");
      throw new Error("Failed to resume audio engine");
    }
  }, [setEngineStatus]);

  useEffect(() => {
    return () => {
      void engineRef.current?.close();
      engineRef.current = null;
    };
  }, []);

  if (!crossOriginOk) {
    return <CrossOriginError />;
  }

  if (engine === null || pool === null) {
    return <ClickToStart onStart={handleStart} />;
  }

  return (
    <ErrorBoundary>
      <AudioEngineProvider engine={engine}>
        <MediaPoolProvider pool={pool}>
          <DawShell sessionStorage={sessionStorage} idbWarning={idbWarning} />
        </MediaPoolProvider>
      </AudioEngineProvider>
    </ErrorBoundary>
  );
}
