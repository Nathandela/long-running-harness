import { useCallback, useRef, useState } from "react";
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
    const engine = createAudioEngine();
    engineRef.current = engine;
    void engine.resume().then(() => {
      setEngineStatus("running");
    });
    setAudioStarted(true);
  }, [setEngineStatus]);

  if (!crossOriginOk) {
    return <CrossOriginError />;
  }

  if (!audioStarted) {
    return <ClickToStart onStart={handleStart} />;
  }

  return <DawShell />;
}
