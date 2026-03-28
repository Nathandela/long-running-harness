/**
 * Provider that creates the routing bridge.
 * Bridges the routing Zustand store to the live RoutingEngine audio graph.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAudioEngine } from "@audio/use-audio-engine";
import { createRoutingEngine, type RoutingEngine } from "./routing";
import { createRoutingBridge, type RoutingBridge } from "./routing-bridge";
import { useEffectsBridgeContext } from "@audio/effects/EffectsBridgeProvider";

type RoutingBridgeContext = {
  readonly routing: RoutingEngine;
};

const Ctx = createContext<RoutingBridgeContext | null>(null);

export function RoutingBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const engine = useAudioEngine();
  const { mixer } = useEffectsBridgeContext();

  const [value] = useState<{
    ctx: RoutingBridgeContext;
    bridge: RoutingBridge;
  }>(() => {
    const routing = createRoutingEngine(engine.ctx);
    const bridge = createRoutingBridge(routing, mixer);
    return { ctx: { routing }, bridge };
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) {
          value.bridge.dispose();
          value.ctx.routing.dispose();
        }
      }, 0);
    };
  }, [value]);

  return <Ctx.Provider value={value.ctx}>{children}</Ctx.Provider>;
}

export function useRoutingBridgeContext(): RoutingBridgeContext {
  const ctx = useContext(Ctx);
  if (ctx === null) {
    throw new Error(
      "useRoutingBridgeContext must be used within RoutingBridgeProvider",
    );
  }
  return ctx;
}
