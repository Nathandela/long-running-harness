/**
 * Reverb effect using ConvolverNode with generated impulse responses.
 * Generates exponentially decaying noise IR at the requested decay time.
 */

import { createBaseEffect } from "./create-effect";
import type { EffectFactory, EffectParameterSchema } from "./types";

const PARAMS: readonly EffectParameterSchema[] = [
  {
    name: "Decay",
    key: "decay",
    min: 0.1,
    max: 10,
    default: 2,
    step: 0.1,
    unit: "s",
  },
  {
    name: "Pre-Delay",
    key: "preDelay",
    min: 0,
    max: 100,
    default: 10,
    step: 1,
    unit: "ms",
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

function generateImpulseResponse(
  ctx: AudioContext,
  decaySeconds: number,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * decaySeconds);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Exponential decay envelope * white noise
      data[i] = (Math.random() * 2 - 1) * Math.exp((-3 * t) / decaySeconds);
    }
  }
  return buffer;
}

export function createReverbFactory(): EffectFactory {
  return {
    definition: { id: "reverb", name: "Reverb", parameters: PARAMS },
    create(ctx, id) {
      let convolver: ConvolverNode;
      let preDelayNode: DelayNode;

      return createBaseEffect({
        ctx,
        id,
        typeId: "reverb",
        params: PARAMS,
        buildChain(inputNode, outputNode) {
          preDelayNode = ctx.createDelay(0.1);
          convolver = ctx.createConvolver();
          convolver.buffer = generateImpulseResponse(ctx, 2);

          inputNode.connect(preDelayNode);
          preDelayNode.connect(convolver);
          convolver.connect(outputNode);
        },
        disposeChain() {
          preDelayNode.disconnect();
          convolver.disconnect();
        },
        applyParam(key, value, setMix) {
          switch (key) {
            case "decay":
              convolver.buffer = generateImpulseResponse(ctx, value);
              break;
            case "preDelay":
              preDelayNode.delayTime.value = value / 1000;
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
