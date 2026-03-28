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
  _effectsBridge: EffectsBridge,
): ParamResolver {
  return (lane: AutomationLane): ResolvedParam | undefined => {
    const { target, trackId } = lane;

    if (target.type === "mixer") {
      const strip = mixer.getStrip(trackId);
      if (!strip) return undefined;

      switch (target.param) {
        case "volume":
          return { param: strip.faderGain.gain, range: VOLUME_RANGE };
        case "pan":
          return { param: strip.panner.pan, range: PAN_RANGE };
      }
    }

    // Effect and synth params require AudioParam exposure from the effect/synth layer.
    // Currently effects use setParam() which doesn't expose raw AudioParams.
    // TODO: expose AudioParams from EffectInstance for sample-accurate automation.
    return undefined;
  };
}
