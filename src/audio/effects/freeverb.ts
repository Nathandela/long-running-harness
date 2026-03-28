/**
 * Freeverb/Schroeder-style algorithmic reverb using native Web Audio nodes.
 * Architecture: 8 parallel comb filters -> 4 cascaded allpass filters.
 * Parameters: room size, damping, pre-delay, wet/dry mix.
 *
 * Comb filter delay times (in samples at 44100Hz) from original Freeverb:
 *   1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617
 * Allpass delay times:
 *   556, 441, 341, 225
 */

import { createBaseEffect } from "./create-effect";
import type { EffectFactory, EffectParameterSchema } from "./types";

const PARAMS: readonly EffectParameterSchema[] = [
  {
    name: "Room Size",
    key: "roomSize",
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    unit: "%",
  },
  {
    name: "Damping",
    key: "damping",
    min: 0,
    max: 100,
    default: 50,
    step: 1,
    unit: "%",
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

// Classic Freeverb comb filter delay times (samples at 44100Hz)
const COMB_DELAYS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
// Allpass delay times
const ALLPASS_DELAYS = [556, 441, 341, 225];

// Freeverb tuning constants
const ROOM_SCALE = 0.28;
const ROOM_OFFSET = 0.7;

/**
 * Map roomSize (0-100%) to comb filter feedback coefficient.
 * Higher room size = longer decay = higher feedback.
 */
function roomToFeedback(roomSize: number): number {
  return ROOM_OFFSET + (roomSize / 100) * ROOM_SCALE;
}

/**
 * Map damping (0-100%) to lowpass cutoff frequency for comb filter damping.
 * A one-pole lowpass in each comb's feedback loop absorbs high frequencies,
 * causing them to decay faster than low frequencies (Schroeder damping).
 * Higher damping = lower cutoff = more HF absorption.
 */
function dampToFreq(damping: number): number {
  const minFreq = 200;
  const maxFreq = 20000;
  return maxFreq * Math.pow(minFreq / maxFreq, damping / 100);
}

type CombFilter = {
  delay: DelayNode;
  feedback: GainNode;
  damper: BiquadFilterNode;
};

type AllpassFilter = {
  delay: DelayNode;
  feedback: GainNode;
  feedforward: GainNode;
  sum: GainNode;
  output: GainNode;
};

export function createFreeverbFactory(): EffectFactory {
  return {
    definition: { id: "freeverb", name: "Freeverb", parameters: PARAMS },
    create(ctx, id) {
      const combs: CombFilter[] = [];
      const allpasses: AllpassFilter[] = [];
      let preDelayNode: DelayNode;
      let combMixer: GainNode;
      let currentRoom = 50;
      let currentDamp = 50;

      return createBaseEffect({
        ctx,
        id,
        typeId: "freeverb",
        params: PARAMS,
        buildChain(inputNode, outputNode) {
          // Pre-delay
          preDelayNode = ctx.createDelay(0.15);
          preDelayNode.delayTime.value = 0.01;
          inputNode.connect(preDelayNode);

          // Comb filter output mixer (sums 8 parallel combs)
          combMixer = ctx.createGain();
          combMixer.gain.value = 0.125; // 1/8 normalization

          // 8 parallel comb filters with lowpass-damped feedback
          for (const delaySamples of COMB_DELAYS) {
            const delayTime = delaySamples / ctx.sampleRate;
            const delay = ctx.createDelay(delayTime + 0.01);
            delay.delayTime.value = delayTime;

            const feedback = ctx.createGain();
            feedback.gain.value = roomToFeedback(50);

            // One-pole lowpass in feedback loop for frequency-dependent decay
            const damper = ctx.createBiquadFilter();
            damper.type = "lowpass";
            damper.frequency.value = dampToFreq(50);
            damper.Q.value = 0;

            // Comb: input -> delay -> mixer, delay -> damper -> feedback -> delay (loop)
            preDelayNode.connect(delay);
            delay.connect(combMixer);
            delay.connect(damper);
            damper.connect(feedback);
            feedback.connect(delay);

            combs.push({ delay, feedback, damper });
          }

          // 4 cascaded allpass filters
          // Allpass: v[n] = x[n] + g*v[n-M], y[n] = -g*v[n] + v[n-M]
          //   feedforward from sum node (v[n]), not raw input (x[n])
          let prevNode: AudioNode = combMixer;

          for (const delaySamples of ALLPASS_DELAYS) {
            const delayTime = delaySamples / ctx.sampleRate;
            const delay = ctx.createDelay(delayTime + 0.01);
            delay.delayTime.value = delayTime;

            const feedback = ctx.createGain();
            feedback.gain.value = 0.5;

            const feedforward = ctx.createGain();
            feedforward.gain.value = -0.5;

            const sum = ctx.createGain();
            sum.gain.value = 1;

            const apOutput = ctx.createGain();
            apOutput.gain.value = 1;

            // Sum node: x[n] + g*v[n-M] = v[n]
            prevNode.connect(sum);
            sum.connect(delay);
            delay.connect(feedback);
            feedback.connect(sum);

            // Feedforward: -g * v[n] (from sum, not raw input)
            sum.connect(feedforward);
            feedforward.connect(apOutput);

            // Delayed path: v[n-M] -> output
            delay.connect(apOutput);

            prevNode = apOutput;
            allpasses.push({
              delay,
              feedback,
              feedforward,
              sum,
              output: apOutput,
            });
          }

          // Connect final allpass output to effect output
          prevNode.connect(outputNode);
        },
        disposeChain() {
          preDelayNode.disconnect();
          combMixer.disconnect();
          for (const c of combs) {
            c.delay.disconnect();
            c.feedback.disconnect();
            c.damper.disconnect();
          }
          for (const a of allpasses) {
            a.delay.disconnect();
            a.feedback.disconnect();
            a.feedforward.disconnect();
            a.sum.disconnect();
            a.output.disconnect();
          }
        },
        applyParam(key, value, setMix) {
          switch (key) {
            case "roomSize":
              currentRoom = value;
              for (const c of combs) {
                c.feedback.gain.value = roomToFeedback(currentRoom);
              }
              break;
            case "damping":
              currentDamp = value;
              for (const c of combs) {
                c.damper.frequency.value = dampToFreq(currentDamp);
              }
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
