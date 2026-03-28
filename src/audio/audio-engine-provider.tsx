/**
 * React Context provider for AudioEngineContext.
 * Allows child components to access the AudioContext
 * without prop drilling from App.tsx.
 */

import type { AudioEngineContext } from "./engine-context";
import { AudioEngineCtx } from "./audio-engine-ctx";

export function AudioEngineProvider({
  engine,
  children,
}: {
  engine: AudioEngineContext;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <AudioEngineCtx.Provider value={engine}>{children}</AudioEngineCtx.Provider>
  );
}
