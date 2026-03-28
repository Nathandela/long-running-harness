/**
 * Distortion effect using WaveShaperNode.
 * Three curve types: soft clip (tanh), hard clip, tube simulation.
 */

import { createBaseEffect } from "./create-effect";
import type { EffectFactory, EffectParameterSchema } from "./types";

const CURVE_SIZE = 4096;

const PARAMS: readonly EffectParameterSchema[] = [
  {
    name: "Drive",
    key: "drive",
    min: 1,
    max: 100,
    default: 20,
    step: 1,
    unit: "",
  },
  {
    name: "Curve Type",
    key: "curveType",
    min: 0,
    max: 2,
    default: 0,
    step: 1,
    unit: "",
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

function makeSoftClipCurve(drive: number): Float32Array {
  const curve = new Float32Array(CURVE_SIZE);
  const k = drive;
  for (let i = 0; i < CURVE_SIZE; i++) {
    const x = (i * 2) / CURVE_SIZE - 1;
    curve[i] = Math.tanh(k * x);
  }
  return curve;
}

function makeHardClipCurve(drive: number): Float32Array {
  const curve = new Float32Array(CURVE_SIZE);
  const threshold = 1 / Math.max(drive, 1);
  for (let i = 0; i < CURVE_SIZE; i++) {
    const x = (i * 2) / CURVE_SIZE - 1;
    curve[i] = Math.max(-1, Math.min(1, x / threshold));
  }
  return curve;
}

function makeTubeCurve(drive: number): Float32Array {
  const curve = new Float32Array(CURVE_SIZE);
  const k = drive * 2;
  for (let i = 0; i < CURVE_SIZE; i++) {
    const x = (i * 2) / CURVE_SIZE - 1;
    // Asymmetric tube-style clipping
    if (x >= 0) {
      curve[i] = 1 - Math.exp(-k * x);
    } else {
      curve[i] = -(1 - Math.exp(k * x));
    }
  }
  return curve;
}

const curveGenerators = [
  makeSoftClipCurve,
  makeHardClipCurve,
  makeTubeCurve,
] as const;

export function createDistortionFactory(): EffectFactory {
  return {
    definition: { id: "distortion", name: "Distortion", parameters: PARAMS },
    create(ctx, id) {
      let shaper: WaveShaperNode;
      let currentDrive = 20;
      let currentCurveType = 0;

      function updateCurve(): void {
        const gen = curveGenerators[currentCurveType] ?? makeSoftClipCurve;
        shaper.curve = gen(currentDrive);
      }

      return createBaseEffect({
        ctx,
        id,
        typeId: "distortion",
        params: PARAMS,
        buildChain(inputNode, outputNode) {
          shaper = ctx.createWaveShaper();
          shaper.oversample = "4x";
          updateCurve();
          inputNode.connect(shaper);
          shaper.connect(outputNode);
        },
        applyParam(key, value, setMix) {
          switch (key) {
            case "drive":
              currentDrive = value;
              updateCurve();
              break;
            case "curveType":
              currentCurveType = Math.round(value);
              updateCurve();
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
