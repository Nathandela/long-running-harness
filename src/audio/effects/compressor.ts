/**
 * Compressor effect using DynamicsCompressorNode.
 * Exposes threshold, ratio, knee, attack, release.
 */

import { createBaseEffect } from "./create-effect";
import type { EffectFactory, EffectParameterSchema } from "./types";

const PARAMS: readonly EffectParameterSchema[] = [
  {
    name: "Threshold",
    key: "threshold",
    min: -60,
    max: 0,
    default: -24,
    step: 0.5,
    unit: "dB",
  },
  {
    name: "Ratio",
    key: "ratio",
    min: 1,
    max: 20,
    default: 4,
    step: 0.5,
    unit: ":1",
  },
  {
    name: "Knee",
    key: "knee",
    min: 0,
    max: 40,
    default: 10,
    step: 0.5,
    unit: "dB",
  },
  {
    name: "Attack",
    key: "attack",
    min: 0,
    max: 1,
    default: 0.003,
    step: 0.001,
    unit: "s",
  },
  {
    name: "Release",
    key: "release",
    min: 0.01,
    max: 1,
    default: 0.25,
    step: 0.01,
    unit: "s",
  },
];

export function createCompressorFactory(): EffectFactory {
  return {
    definition: { id: "compressor", name: "Compressor", parameters: PARAMS },
    create(ctx, id) {
      let comp: DynamicsCompressorNode;

      const effect = createBaseEffect({
        ctx,
        id,
        typeId: "compressor",
        params: PARAMS,
        buildChain(inputNode, outputNode) {
          comp = ctx.createDynamicsCompressor();
          inputNode.connect(comp);
          comp.connect(outputNode);
        },
        disposeChain() {
          comp.disconnect();
        },
        applyParam(key, value) {
          switch (key) {
            case "threshold":
              comp.threshold.value = value;
              break;
            case "ratio":
              comp.ratio.value = value;
              break;
            case "knee":
              comp.knee.value = value;
              break;
            case "attack":
              comp.attack.value = value;
              break;
            case "release":
              comp.release.value = value;
              break;
          }
        },
      });

      return effect;
    },
  };
}
