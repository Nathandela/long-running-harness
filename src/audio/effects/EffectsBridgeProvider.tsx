/**
 * Provider that creates the effects bridge, mixer engine, and registry.
 * Bridges the effects Zustand store to live Web Audio nodes.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAudioEngine } from "@audio/use-audio-engine";
import { createMixerEngine, type MixerEngine } from "@audio/mixer";
import type { EffectRegistry } from "./types";
import { createDefaultRegistry } from "./default-registry";
import { createEffectsBridge, type EffectsBridge } from "./effects-bridge";
import { useTransport } from "@audio/use-transport";
import { createParamResolver } from "@audio/automation/create-param-resolver";

type EffectsBridgeContext = {
  readonly registry: EffectRegistry;
  readonly mixer: MixerEngine;
  readonly bridge: EffectsBridge;
};

const Ctx = createContext<EffectsBridgeContext | null>(null);

export function EffectsBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const engine = useAudioEngine();
  const transport = useTransport();

  const [value] = useState<EffectsBridgeContext>(() => {
    const registry = createDefaultRegistry();
    const mixer = createMixerEngine(engine.ctx);
    const bridge = createEffectsBridge(engine.ctx, registry, mixer);
    return { registry, mixer, bridge };
  });

  // Wire automation param resolver to live mixer AudioParams
  useEffect(() => {
    transport.setParamResolver(createParamResolver(value.mixer, value.bridge));
  }, [value, transport]);

  // Guard against StrictMode double-mount: only dispose on true unmount.
  // useState initializers are called once and cached in React 18/19,
  // so the deferred check is sufficient — no duplicate instances are created.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Defer disposal so StrictMode re-mount can cancel it
      setTimeout(() => {
        if (!mountedRef.current) {
          value.bridge.dispose();
          value.mixer.dispose();
        }
      }, 0);
    };
  }, [value]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEffectsBridgeContext(): EffectsBridgeContext {
  const ctx = useContext(Ctx);
  if (ctx === null) {
    throw new Error(
      "useEffectsBridgeContext must be used within EffectsBridgeProvider",
    );
  }
  return ctx;
}
