/**
 * React Context provider for MediaPool.
 * Allows child components to access the media pool
 * without prop drilling.
 */

import type { MediaPool } from "./types";
import { MediaPoolCtx } from "./media-pool-ctx";

export function MediaPoolProvider({
  pool,
  children,
}: {
  pool: MediaPool;
  children: React.ReactNode;
}): React.JSX.Element {
  return <MediaPoolCtx.Provider value={pool}>{children}</MediaPoolCtx.Provider>;
}
