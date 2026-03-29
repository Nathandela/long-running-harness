/**
 * Base effect builder with wet/dry bypass infrastructure.
 * Every effect uses this to get consistent bypass, mix, and param management.
 */

import type { EffectInstance, EffectParameterSchema } from "./types";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export type ApplyParamFn = (
  key: string,
  value: number,
  setMix: (wet: number) => void,
) => void;

export type CreateEffectOptions = {
  ctx: AudioContext;
  id: string;
  typeId: string;
  params: readonly EffectParameterSchema[];
  /** Wire internal effect nodes between inputNode and outputNode */
  buildChain(inputNode: GainNode, outputNode: GainNode): void;
  /** Called when a parameter changes. Use setMix callback for mix params. */
  applyParam: ApplyParamFn;
  /** Resolve a param key to its underlying AudioParam for automation */
  resolveAudioParam?: (key: string) => AudioParam | undefined;
  /** Clean up internal effect nodes (stop oscillators, disconnect nodes) */
  disposeChain?: () => void;
};

/**
 * Creates a base effect instance with:
 * - Wet/dry split: input -> dryGain -> output, input -> [effect chain] -> wetGain -> output
 * - Bypass toggle (sets dry=1, wet=0)
 * - Parameter storage with clamping
 */
export function createBaseEffect(opts: CreateEffectOptions): EffectInstance {
  const { ctx, id, typeId, params, applyParam } = opts;

  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  // Internal nodes for the effect chain
  const effectInput = ctx.createGain();
  const effectOutput = ctx.createGain();

  // Dry path: input -> dryGain -> output
  input.connect(dryGain);
  dryGain.connect(output);

  // Wet path: input -> effectInput -> [effect chain] -> effectOutput -> wetGain -> output
  input.connect(effectInput);
  opts.buildChain(effectInput, effectOutput);
  effectOutput.connect(wetGain);
  wetGain.connect(output);

  // Default: fully wet (no dry signal)
  dryGain.gain.value = 0;
  wetGain.gain.value = 1;

  // Parameter storage
  const paramMap = new Map<
    string,
    { schema: EffectParameterSchema; value: number }
  >();
  for (const p of params) {
    paramMap.set(p.key, { schema: p, value: p.default });
  }

  let bypassed = false;
  let mixLevel = 1; // 0 = fully dry, 1 = fully wet

  // 5ms ramp avoids audible clicks on gain changes
  const RAMP_TIME = 0.005;

  function rampTo(param: AudioParam, value: number): void {
    if (typeof param.linearRampToValueAtTime === "function") {
      param.setValueAtTime(param.value, ctx.currentTime);
      param.linearRampToValueAtTime(value, ctx.currentTime + RAMP_TIME);
    } else {
      param.value = value;
    }
  }

  function applyMix(): void {
    if (bypassed) {
      rampTo(dryGain.gain, 1);
      rampTo(wetGain.gain, 0);
    } else {
      rampTo(dryGain.gain, 1 - mixLevel);
      rampTo(wetGain.gain, mixLevel);
    }
  }

  function setMix(wet: number): void {
    mixLevel = clamp(wet, 0, 1);
    applyMix();
  }

  const instance: EffectInstance = {
    id,
    typeId,
    input,
    output,
    dryGain,
    wetGain,
    bypassed: false,

    getParam(key: string): number {
      return paramMap.get(key)?.value ?? 0;
    },

    setParam(key: string, value: number): void {
      const entry = paramMap.get(key);
      if (!entry) return;
      entry.value = clamp(value, entry.schema.min, entry.schema.max);
      applyParam(key, entry.value, setMix);
    },

    setBypassed(b: boolean): void {
      bypassed = b;
      instance.bypassed = b;
      applyMix();
    },

    setMix,

    getAudioParam(key: string): AudioParam | undefined {
      return opts.resolveAudioParam?.(key);
    },

    getParamRange(key: string): { min: number; max: number } | undefined {
      const entry = paramMap.get(key);
      if (!entry) return undefined;
      return { min: entry.schema.min, max: entry.schema.max };
    },

    dispose(): void {
      opts.disposeChain?.();
      for (const node of [
        input,
        output,
        dryGain,
        wetGain,
        effectInput,
        effectOutput,
      ]) {
        try {
          node.disconnect();
        } catch {
          // Node may not be connected -- safe to ignore
        }
      }
    },
  };

  // Initialize all params (deferred to after instance creation)
  for (const [key, entry] of paramMap) {
    applyParam(key, entry.value, setMix);
  }

  return instance;
}
