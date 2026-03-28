/**
 * Provider that creates the effects bridge, mixer engine, and registry.
 * Bridges the effects Zustand store to live Web Audio nodes.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { useAudioEngine } from "@audio/use-audio-engine";
import { createMixerEngine, type MixerEngine } from "@audio/mixer";
import type { EffectRegistry } from "./types";
import { createDefaultRegistry } from "./default-registry";
import { createEffectsBridge, type EffectsBridge } from "./effects-bridge";

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

  const [value] = useState<EffectsBridgeContext>(() => {
    const registry = createDefaultRegistry();
    const mixer = createMixerEngine(engine.ctx);
    const bridge = createEffectsBridge(engine.ctx, registry, mixer);
    return { registry, mixer, bridge };
  });

  useEffect(() => {
    return () => {
      value.bridge.dispose();
      value.mixer.dispose();
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
