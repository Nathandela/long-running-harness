/**
 * React Context provider for transport controls.
 * Ensures a single TransportClock, Scheduler, and Metronome
 * instance is shared by all consumers.
 */

import { useTransportInit } from "./use-transport";
import { TransportCtx } from "./transport-ctx";

export function TransportProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const transport = useTransportInit();
  return (
    <TransportCtx.Provider value={transport}>{children}</TransportCtx.Provider>
  );
}
