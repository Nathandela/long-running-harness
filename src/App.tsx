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
import { useDawStore } from "@state/index";

export function App(): React.JSX.Element {
  const crossOriginOk = isCrossOriginIsolated();
  const [engine, setEngine] = useState<AudioEngineContext | null>(null);
  const engineRef = useRef<AudioEngineContext | null>(null);
  const setEngineStatus = useDawStore((s) => s.setEngineStatus);

  const pool = useMemo<MediaPool | null>(() => {
    if (engine === null) return null;
    const storage = createIndexedDBStorage();
    const p = createMediaPool(engine.ctx, storage);
    void p.init();
    return p;
  }, [engine]);

  const handleStart = useCallback((): void => {
    if (engineRef.current) return;

    let newEngine: AudioEngineContext;
    try {
      newEngine = createAudioEngine();
    } catch {
      setEngineStatus("error");
      return;
    }

    engineRef.current = newEngine;
    newEngine.resume().then(
      () => {
        if (engineRef.current !== newEngine) return;
        setEngineStatus("running");
        setEngine(newEngine);
      },
      () => {
        void newEngine.close();
        if (engineRef.current === newEngine) {
          engineRef.current = null;
        }
        setEngineStatus("error");
      },
    );
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
    <AudioEngineProvider engine={engine}>
      <MediaPoolProvider pool={pool}>
        <DawShell />
      </MediaPoolProvider>
    </AudioEngineProvider>
  );
}
