/**
 * Modulation engine: pure, zero-allocation functions for computing
 * modulation offsets from routes. Used inside the AudioWorklet processor.
 *
 * Design: Pre-allocated accumulators are reset each quantum, then
 * each active route adds source * amount to its destination accumulator.
 * The processor reads accumulators to offset synth parameters.
 */

// ─── Source and destination index maps (numeric for worklet) ───

export const SOURCE_INDEX = {
  lfo1: 0,
  lfo2: 1,
  ampEnv: 2,
  filterEnv: 3,
  velocity: 4,
  aftertouch: 5,
  modWheel: 6,
  pitchBend: 7,
} as const;

export const DEST_INDEX = {
  osc1Pitch: 0,
  osc2Pitch: 1,
  oscMix: 2,
  filterCutoff: 3,
  filterResonance: 4,
  ampLevel: 5,
  lfo1Rate: 6,
  lfo2Rate: 7,
} as const;

// ─── Accumulators ───

export type ModAccumulators = {
  osc1Pitch: number;
  osc2Pitch: number;
  oscMix: number;
  filterCutoff: number;
  filterResonance: number;
  ampLevel: number;
  lfo1Rate: number;
  lfo2Rate: number;
};

export function createModAccumulators(): ModAccumulators {
  return {
    osc1Pitch: 0,
    osc2Pitch: 0,
    oscMix: 0,
    filterCutoff: 0,
    filterResonance: 0,
    ampLevel: 0,
    lfo1Rate: 0,
    lfo2Rate: 0,
  };
}

export function resetAccumulators(acc: ModAccumulators): void {
  acc.osc1Pitch = 0;
  acc.osc2Pitch = 0;
  acc.oscMix = 0;
  acc.filterCutoff = 0;
  acc.filterResonance = 0;
  acc.ampLevel = 0;
  acc.lfo1Rate = 0;
  acc.lfo2Rate = 0;
}

// Dest keys indexed by DEST_INDEX values for fast lookup
const DEST_KEYS: readonly (keyof ModAccumulators)[] = [
  "osc1Pitch",
  "osc2Pitch",
  "oscMix",
  "filterCutoff",
  "filterResonance",
  "ampLevel",
  "lfo1Rate",
  "lfo2Rate",
];

/**
 * Apply a single modulation route to accumulators.
 * Zero-allocation: reads from pre-allocated sourceValues array,
 * writes to pre-allocated accumulators object.
 */
export function applyModRoute(
  acc: ModAccumulators,
  sourceValues: Float64Array,
  sourceIdx: number,
  destIdx: number,
  amount: number,
  bipolar: boolean,
): void {
  const raw = sourceValues[sourceIdx] ?? 0;
  const value = bipolar ? raw : (raw + 1) / 2;
  const key = DEST_KEYS[destIdx];
  if (key !== undefined) {
    acc[key] += value * amount;
  }
}

// ─── Serialized route format for worklet MessagePort ───

export type WorkletModRoute = {
  sourceIdx: number;
  destIdx: number;
  amount: number;
  bipolar: boolean;
};
