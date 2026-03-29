/**
 * Creates a ParamResolver that maps automation lane targets to live AudioParams.
 * Bridges the automation scheduler to the mixer engine's real Web Audio nodes.
 */

import type { MixerEngine } from "@audio/mixer";
import type { EffectsBridge } from "@audio/effects/effects-bridge";
import type { AutomationLane } from "./automation-types";
import type { ResolvedParam, ParamResolver } from "./automation-scheduler";

/** Mixer fader range: 0 (silence) to 2 (boost) */
const VOLUME_RANGE = { min: 0, max: 2 } as const;

/** Stereo pan range: -1 (left) to 1 (right) */
const PAN_RANGE = { min: -1, max: 1 } as const;

export function createParamResolver(
  mixer: MixerEngine,
  effectsBridge: EffectsBridge,
): ParamResolver {
  return (lane: AutomationLane): ResolvedParam | undefined => {
    const { target } = lane;

    if (target.type === "mixer") {
      const strip = mixer.getStrip(lane.trackId);
      if (!strip) return undefined;

      switch (target.param) {
        case "volume":
          return { param: strip.faderGain.gain, range: VOLUME_RANGE };
        case "pan":
          return { param: strip.panner.pan, range: PAN_RANGE };
      }
    }

    if (target.type === "effect") {
      const instance = effectsBridge.getInstance(target.effectId);
      if (!instance) return undefined;

      const param = instance.getAudioParam(target.paramKey);
      if (!param) return undefined;

      const range = instance.getParamRange(target.paramKey);
      if (!range) return undefined;

      return { param, range };
    }

    return undefined;
  };
}
