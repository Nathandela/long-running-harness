/**
 * Core types for the automation system.
 * Automation lanes contain breakpoint curves that control parameters over time.
 */

/** Interpolation mode between automation points */
export type InterpolationMode = "linear" | "curved";

/** Automation playback/recording mode */
export type AutomationMode = "read" | "write" | "touch";

/** A single automation breakpoint */
export type AutomationPoint = {
  readonly id: string;
  /** Time position in seconds on the arrangement timeline */
  readonly time: number;
  /** Normalized value 0..1 (mapped to parameter range externally) */
  readonly value: number;
  /** Interpolation mode to the NEXT point */
  readonly interpolation: InterpolationMode;
  /** Bezier curve tension for "curved" interpolation (-1..1, 0 = linear) */
  readonly curve: number;
};

/** Target parameter that an automation lane controls */
export type ParameterTarget =
  | { readonly type: "mixer"; readonly param: "volume" | "pan" }
  | {
      readonly type: "effect";
      readonly effectId: string;
      readonly paramKey: string;
    }
  | {
      readonly type: "synth";
      readonly paramKey: string;
    };

/** A single automation lane associated with a track */
export type AutomationLane = {
  readonly id: string;
  readonly trackId: string;
  readonly target: ParameterTarget;
  readonly points: readonly AutomationPoint[];
  readonly mode: AutomationMode;
  /** Whether automation is actively overriding manual control */
  readonly armed: boolean;
};

/** Range definition for mapping normalized 0..1 to actual parameter values */
export type ParameterRange = {
  readonly min: number;
  readonly max: number;
};

/** Default automation mode */
export const DEFAULT_AUTOMATION_MODE: AutomationMode = "read";

/** Lane ID counter (module-level for persistence seeding) */
let laneCounter = 0;

export function nextLaneId(): string {
  return `lane-${String(++laneCounter)}`;
}

/** Seed counter to avoid ID collisions after session load */
export function _seedLaneCounter(minValue: number): void {
  if (minValue > laneCounter) {
    laneCounter = minValue;
  }
}

/** Reset counter (for tests) */
export function _resetLaneCounter(): void {
  laneCounter = 0;
}
