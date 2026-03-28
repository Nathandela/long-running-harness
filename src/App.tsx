import { useCallback, useEffect, useRef, useState } from "react";
import {
  isCrossOriginIsolated,
  createAudioEngine,
  type AudioEngineContext,
} from "@audio/index";
import { AudioEngineProvider } from "@audio/audio-engine-provider";
import { CrossOriginError, ClickToStart, DawShell } from "@ui/index";
import { useDawStore } from "@state/index";

export function App(): React.JSX.Element {
  const crossOriginOk = isCrossOriginIsolated();
  const [engine, setEngine] = useState<AudioEngineContext | null>(null);
  const engineRef = useRef<AudioEngineContext | null>(null);
  const setEngineStatus = useDawStore((s) => s.setEngineStatus);

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

  if (engine === null) {
    return <ClickToStart onStart={handleStart} />;
  }

  return (
    <AudioEngineProvider engine={engine}>
      <DawShell />
    </AudioEngineProvider>
  );
}
