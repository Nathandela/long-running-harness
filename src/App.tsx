import { useCallback, useEffect, useRef, useState } from "react";
import {
  isCrossOriginIsolated,
  createAudioEngine,
  type AudioEngineContext,
} from "@audio/index";
import { CrossOriginError, ClickToStart, DawShell } from "@ui/index";
import { useDawStore } from "@state/index";

export function App(): React.JSX.Element {
  const crossOriginOk = isCrossOriginIsolated();
  const [audioStarted, setAudioStarted] = useState(false);
  const engineRef = useRef<AudioEngineContext | null>(null);
  const setEngineStatus = useDawStore((s) => s.setEngineStatus);

  const handleStart = useCallback((): void => {
    if (engineRef.current) return;

    let engine: AudioEngineContext;
    try {
      engine = createAudioEngine();
    } catch {
      setEngineStatus("error");
      return;
    }

    engineRef.current = engine;
    engine.resume().then(
      () => {
        if (engineRef.current !== engine) return;
        setEngineStatus("running");
        setAudioStarted(true);
      },
      () => {
        void engine.close();
        if (engineRef.current === engine) {
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

  if (!audioStarted) {
    return <ClickToStart onStart={handleStart} />;
  }

  return <DawShell />;
}
