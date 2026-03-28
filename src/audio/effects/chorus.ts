/**
 * Chorus/Flanger/Phaser effect using modulated delay.
 * DelayNode modulated by OscillatorNode LFO.
 */

import { createBaseEffect } from "./create-effect";
import type { EffectFactory, EffectParameterSchema } from "./types";

const PARAMS: readonly EffectParameterSchema[] = [
  {
    name: "Rate",
    key: "rate",
    min: 0.1,
    max: 10,
    default: 1.5,
    step: 0.1,
    unit: "Hz",
  },
  {
    name: "Depth",
    key: "depth",
    min: 0,
    max: 20,
    default: 5,
    step: 0.1,
    unit: "ms",
  },
  {
    name: "Mix",
    key: "mix",
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    unit: "%",
  },
];

export function createChorusFactory(): EffectFactory {
  return {
    definition: { id: "chorus", name: "Chorus", parameters: PARAMS },
    create(ctx, id) {
      let lfo: OscillatorNode;
      let lfoGain: GainNode;
      let delayNode: DelayNode;

      return createBaseEffect({
        ctx,
        id,
        typeId: "chorus",
        params: PARAMS,
        buildChain(inputNode, outputNode) {
          delayNode = ctx.createDelay(0.05);
          delayNode.delayTime.value = 0.01;

          lfo = ctx.createOscillator();
          lfo.type = "sine";
          lfo.frequency.value = 1.5;

          lfoGain = ctx.createGain();
          lfoGain.gain.value = 0.005;

          lfo.connect(lfoGain);
          lfoGain.connect(delayNode.delayTime as unknown as AudioParam);

          inputNode.connect(delayNode);
          delayNode.connect(outputNode);

          lfo.start();
        },
        disposeChain() {
          lfo.stop();
          lfo.disconnect();
          lfoGain.disconnect();
          delayNode.disconnect();
        },
        applyParam(key, value, setMix) {
          switch (key) {
            case "rate":
              lfo.frequency.value = value;
              break;
            case "depth":
              lfoGain.gain.value = value / 1000;
              break;
            case "mix":
              setMix(value / 100);
              break;
          }
        },
      });
    },
  };
}
