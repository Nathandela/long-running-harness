/**
 * React Context for AudioEngineContext.
 * Separated from the provider component for react-refresh compatibility.
 */

import { createContext } from "react";
import type { AudioEngineContext } from "./engine-context";

export const AudioEngineCtx = createContext<AudioEngineContext | null>(null);
