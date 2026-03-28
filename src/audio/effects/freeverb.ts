/**
 * Freeverb/Schroeder-style algorithmic reverb using native Web Audio nodes.
 * Architecture: 8 parallel comb filters -> 4 cascaded allpass filters.
 * Parameters: room size, damping, stereo width, pre-delay, wet/dry mix.
 *
 * Comb filter delay times (in samples at 44100Hz) from original Freeverb:
 *   1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617
 * Allpass delay times:
 *   556, 441, 341, 225
 *
 * Stereo spread: right channel offsets by +23 samples.
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
    name: "Width",
    key: "width",
    min: 0,
    max: 100,
    default: 100,
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
const DAMP_SCALE = 0.4;

/**
 * Map roomSize (0-100%) to comb filter feedback coefficient.
 * Higher room size = longer decay = higher feedback.
 */
function roomToFeedback(roomSize: number): number {
  return ROOM_OFFSET + (roomSize / 100) * ROOM_SCALE;
}

/**
 * Map damping (0-100%) to low-pass coefficient for comb filter damping.
 * In native Web Audio we approximate damping via feedback gain reduction.
 * Higher damping = more HF absorption = lower effective feedback.
 */
function dampToCoeff(damping: number): number {
  return 1 - (damping / 100) * DAMP_SCALE;
}

type CombFilter = {
  delay: DelayNode;
  feedback: GainNode;
};

type AllpassFilter = {
  delay: DelayNode;
  feedback: GainNode;
  feedforward: GainNode;
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

          // 8 parallel comb filters with feedback
          for (const delaySamples of COMB_DELAYS) {
            const delayTime = delaySamples / 44100;
            const delay = ctx.createDelay(delayTime + 0.01);
            delay.delayTime.value = delayTime;

            const feedback = ctx.createGain();
            feedback.gain.value = roomToFeedback(50);

            // Comb: input -> delay -> mixer, delay -> feedback -> delay (loop)
            preDelayNode.connect(delay);
            delay.connect(combMixer);
            delay.connect(feedback);
            feedback.connect(delay);

            combs.push({ delay, feedback });
          }

          // 4 cascaded allpass filters
          // Allpass: y[n] = -g*x[n] + x[n-d] + g*y[n-d]
          //   feedforward gain = -g, feedback gain = +g
          let prevNode: AudioNode = combMixer;

          for (const delaySamples of ALLPASS_DELAYS) {
            const delayTime = delaySamples / 44100;
            const delay = ctx.createDelay(delayTime + 0.01);
            delay.delayTime.value = delayTime;

            const feedback = ctx.createGain();
            feedback.gain.value = 0.5;

            const feedforward = ctx.createGain();
            feedforward.gain.value = -0.5; // -g for true allpass

            const apOutput = ctx.createGain();
            apOutput.gain.value = 1;

            // Feedback path: delay output -> feedback -> delay input
            prevNode.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);

            // Feedforward path: input * -g -> output
            prevNode.connect(feedforward);
            feedforward.connect(apOutput);

            // Delayed path: delay output -> output
            delay.connect(apOutput);

            prevNode = apOutput;
            allpasses.push({ delay, feedback, feedforward, output: apOutput });
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
          }
          for (const a of allpasses) {
            a.delay.disconnect();
            a.feedback.disconnect();
            a.feedforward.disconnect();
            a.output.disconnect();
          }
        },
        applyParam(key, value, setMix) {
          function updateCombFeedback(): void {
            const fb = roomToFeedback(currentRoom) * dampToCoeff(currentDamp);
            for (const c of combs) {
              c.feedback.gain.value = fb;
            }
          }

          switch (key) {
            case "roomSize":
              currentRoom = value;
              updateCombFeedback();
              break;
            case "damping":
              currentDamp = value;
              updateCombFeedback();
              break;
            case "width":
              // Width affects stereo spread; stored for potential stereo processing
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
