/**
 * Pre-populated effect registry with all built-in effect factories.
 * Single source of truth for available effect types.
 */

import type { EffectRegistry } from "./types";
import { createEffectRegistry } from "./registry";
import { createReverbFactory } from "./reverb";
import { createDelayFactory } from "./delay";
import { createCompressorFactory } from "./compressor";
import { createEqFactory } from "./eq";
import { createDistortionFactory } from "./distortion";
import { createChorusFactory } from "./chorus";

export function createDefaultRegistry(): EffectRegistry {
  const registry = createEffectRegistry();
  registry.register(createReverbFactory());
  registry.register(createDelayFactory());
  registry.register(createCompressorFactory());
  registry.register(createEqFactory());
  registry.register(createDistortionFactory());
  registry.register(createChorusFactory());
  return registry;
}
