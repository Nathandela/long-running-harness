/**
 * Effect factory registry.
 * Register effect factories by type ID, create instances on demand.
 */

import type { EffectFactory, EffectInstance, EffectRegistry } from "./types";

export function createEffectRegistry(): EffectRegistry {
  const factories = new Map<string, EffectFactory>();

  return {
    register(factory: EffectFactory): void {
      factories.set(factory.definition.id, factory);
    },

    get(typeId: string): EffectFactory | undefined {
      return factories.get(typeId);
    },

    getAll(): readonly EffectFactory[] {
      return [...factories.values()];
    },

    create(typeId: string, ctx: AudioContext, id?: string): EffectInstance {
      const factory = factories.get(typeId);
      if (!factory) {
        throw new Error(`Unknown effect type: ${typeId}`);
      }
      const instanceId = id ?? `${typeId}-${crypto.randomUUID()}`;
      return factory.create(ctx, instanceId);
    },
  };
}
