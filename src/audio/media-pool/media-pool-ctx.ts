/**
 * React Context for MediaPool.
 * Separated from the provider for react-refresh compatibility.
 */

import { createContext } from "react";
import type { MediaPool } from "./types";

export const MediaPoolCtx = createContext<MediaPool | null>(null);
