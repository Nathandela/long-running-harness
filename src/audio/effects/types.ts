/**
 * Core types for the effects rack system.
 * Effect factory registry pattern: given type ID -> AudioNode chain + parameter schema.
 */

import type { z } from "zod/v4";

export type EffectParameterSchema = {
  readonly name: string;
  readonly key: string;
  readonly min: number;
  readonly max: number;
  readonly default: number;
  readonly step: number;
  readonly unit: string;
};

export type EffectDefinition = {
  readonly id: string;
  readonly name: string;
  readonly parameters: readonly EffectParameterSchema[];
};

export type EffectInstance = {
  readonly id: string;
  readonly typeId: string;
  readonly input: AudioNode;
  readonly output: AudioNode;
  readonly dryGain: GainNode;
  readonly wetGain: GainNode;
  bypassed: boolean;
  getParam(key: string): number;
  setParam(key: string, value: number): void;
  setBypassed(bypassed: boolean): void;
  setMix(wet: number): void;
  dispose(): void;
};

export type EffectPreset = {
  readonly typeId: string;
  readonly name: string;
  readonly params: Record<string, number>;
};

export type EffectFactory = {
  readonly definition: EffectDefinition;
  create(ctx: AudioContext, id: string): EffectInstance;
};

export type EffectRegistry = {
  register(factory: EffectFactory): void;
  get(typeId: string): EffectFactory | undefined;
  getAll(): readonly EffectFactory[];
  create(typeId: string, ctx: AudioContext, id?: string): EffectInstance;
};

/** Zod schema type for preset validation (runtime) */
export type EffectPresetSchema = z.ZodType<EffectPreset>;
