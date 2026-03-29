/**
 * 3-band parametric EQ using cascaded BiquadFilterNodes.
 * Low shelf -> Peaking (mid) -> High shelf.
 */

import { createBaseEffect } from "./create-effect";
import type { EffectFactory, EffectParameterSchema } from "./types";

const PARAMS: readonly EffectParameterSchema[] = [
  {
    name: "Low Freq",
    key: "lowFreq",
    min: 20,
    max: 500,
    default: 100,
    step: 1,
    unit: "Hz",
  },
  {
    name: "Low Gain",
    key: "lowGain",
    min: -24,
    max: 24,
    default: 0,
    step: 0.5,
    unit: "dB",
  },
  {
    name: "Mid Freq",
    key: "midFreq",
    min: 200,
    max: 8000,
    default: 1000,
    step: 1,
    unit: "Hz",
  },
  {
    name: "Mid Gain",
    key: "midGain",
    min: -24,
    max: 24,
    default: 0,
    step: 0.5,
    unit: "dB",
  },
  {
    name: "Mid Q",
    key: "midQ",
    min: 0.1,
    max: 18,
    default: 1.4,
    step: 0.1,
    unit: "",
  },
  {
    name: "High Freq",
    key: "highFreq",
    min: 2000,
    max: 20000,
    default: 8000,
    step: 1,
    unit: "Hz",
  },
  {
    name: "High Gain",
    key: "highGain",
    min: -24,
    max: 24,
    default: 0,
    step: 0.5,
    unit: "dB",
  },
];

export function createEqFactory(): EffectFactory {
  return {
    definition: { id: "eq", name: "Parametric EQ", parameters: PARAMS },
    create(ctx, id) {
      let lowShelf: BiquadFilterNode;
      let mid: BiquadFilterNode;
      let highShelf: BiquadFilterNode;

      const effect = createBaseEffect({
        ctx,
        id,
        typeId: "eq",
        params: PARAMS,
        buildChain(inputNode, outputNode) {
          lowShelf = ctx.createBiquadFilter();
          lowShelf.type = "lowshelf";
          lowShelf.frequency.value = 100;
          lowShelf.gain.value = 0;

          mid = ctx.createBiquadFilter();
          mid.type = "peaking";
          mid.frequency.value = 1000;
          mid.Q.value = 1.4;
          mid.gain.value = 0;

          highShelf = ctx.createBiquadFilter();
          highShelf.type = "highshelf";
          highShelf.frequency.value = 8000;
          highShelf.gain.value = 0;

          // Cascade: input -> low shelf -> mid -> high shelf -> output
          inputNode.connect(lowShelf);
          lowShelf.connect(mid);
          mid.connect(highShelf);
          highShelf.connect(outputNode);
        },
        disposeChain() {
          lowShelf.disconnect();
          mid.disconnect();
          highShelf.disconnect();
        },
        applyParam(key, value) {
          switch (key) {
            case "lowFreq":
              lowShelf.frequency.value = value;
              break;
            case "lowGain":
              lowShelf.gain.value = value;
              break;
            case "midFreq":
              mid.frequency.value = value;
              break;
            case "midGain":
              mid.gain.value = value;
              break;
            case "midQ":
              mid.Q.value = value;
              break;
            case "highFreq":
              highShelf.frequency.value = value;
              break;
            case "highGain":
              highShelf.gain.value = value;
              break;
          }
        },
        resolveAudioParam(key) {
          switch (key) {
            case "lowFreq":
              return lowShelf.frequency;
            case "lowGain":
              return lowShelf.gain;
            case "midFreq":
              return mid.frequency;
            case "midGain":
              return mid.gain;
            case "midQ":
              return mid.Q;
            case "highFreq":
              return highShelf.frequency;
            case "highGain":
              return highShelf.gain;
            default:
              return undefined;
          }
        },
      });

      return effect;
    },
  };
}
