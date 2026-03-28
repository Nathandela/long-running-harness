/**
 * Hook to access the AudioEngineContext from the provider.
 */

import { useContext } from "react";
import type { AudioEngineContext } from "./engine-context";
import { AudioEngineCtx } from "./audio-engine-ctx";

export function useAudioEngine(): AudioEngineContext {
  const engine = useContext(AudioEngineCtx);
  if (engine === null) {
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  }
  return engine;
}
