/**
 * Hook to access the MediaPool from the provider.
 */

import { useContext } from "react";
import type { MediaPool } from "./types";
import { MediaPoolCtx } from "./media-pool-ctx";

export function useMediaPool(): MediaPool {
  const pool = useContext(MediaPoolCtx);
  if (pool === null) {
    throw new Error("useMediaPool must be used within MediaPoolProvider");
  }
  return pool;
}
