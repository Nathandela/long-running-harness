/**
 * Delay effect: simple delay with feedback via DelayNode + GainNode.
 * Feedback is clamped to <1.0 to prevent runaway oscillation.
 */

import { createBaseEffect } from "./create-effect";
import type { EffectFactory, EffectParameterSchema } from "./types";

const MAX_FEEDBACK = 0.95;

const PARAMS: readonly EffectParameterSchema[] = [
  {
    name: "Time",
    key: "time",
    min: 0.01,
    max: 2,
    default: 0.3,
    step: 0.01,
    unit: "s",
  },
  {
    name: "Feedback",
    key: "feedback",
    min: 0,
    max: MAX_FEEDBACK,
    default: 0.4,
    step: 0.01,
    unit: "",
  },
  {
    name: "Mix",
    key: "mix",
    min: 0,
    max: 100,
    default: 30,
    step: 1,
    unit: "%",
  },
];

export function createDelayFactory(): EffectFactory {
  return {
    definition: { id: "delay", name: "Delay", parameters: PARAMS },
    create(ctx, id) {
      let delayNode: DelayNode;
      let feedbackGain: GainNode;

      return createBaseEffect({
        ctx,
        id,
        typeId: "delay",
        params: PARAMS,
        buildChain(inputNode, outputNode) {
          delayNode = ctx.createDelay(2);
          feedbackGain = ctx.createGain();

          delayNode.delayTime.value = 0.3;
          feedbackGain.gain.value = 0.4;

          inputNode.connect(delayNode);
          delayNode.connect(outputNode);
          delayNode.connect(feedbackGain);
          feedbackGain.connect(delayNode);
        },
        disposeChain() {
          delayNode.disconnect();
          feedbackGain.disconnect();
        },
        applyParam(key, value, setMix) {
          switch (key) {
            case "time":
              delayNode.delayTime.value = value;
              break;
            case "feedback":
              feedbackGain.gain.value = Math.min(value, MAX_FEEDBACK);
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
