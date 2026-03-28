/**
 * Types and constants for the arpeggiator engine.
 * Pattern-based note generation from held MIDI notes.
 *
 * EARS: R-EVT-15, R-STA-07 (latch mode)
 */

// ─── Pattern modes ───

export const ARP_PATTERNS = [
  "up",
  "down",
  "up-down",
  "down-up",
  "random",
  "as-played",
] as const;
export type ArpPattern = (typeof ARP_PATTERNS)[number];

// ─── Octave direction ───

export const ARP_DIRECTIONS = ["up", "down", "up-down"] as const;
export type ArpDirection = (typeof ARP_DIRECTIONS)[number];

// ─── Rate divisions ───

export const ARP_RATE_DIVISIONS = [
  "1/4",
  "1/8",
  "1/16",
  "1/32",
  "1/4t",
  "1/8t",
  "1/16t",
  "1/32t",
] as const;
export type ArpRateDivision = (typeof ARP_RATE_DIVISIONS)[number];

/** Convert a rate division to beats (quarter notes). */
export function rateDivisionToBeats(division: ArpRateDivision): number {
  const map: Record<ArpRateDivision, number> = {
    "1/4": 1,
    "1/8": 0.5,
    "1/16": 0.25,
    "1/32": 0.125,
    "1/4t": 2 / 3,
    "1/8t": 1 / 3,
    "1/16t": 1 / 6,
    "1/32t": 1 / 12,
  };
  return map[division];
}

// ─── Arpeggiator parameters ───

export type ArpParams = {
  readonly enabled: boolean;
  readonly pattern: ArpPattern;
  readonly rateDivision: ArpRateDivision;
  readonly octaveRange: number; // 1-4
  readonly octaveDirection: ArpDirection;
  readonly gate: number; // 0.01-1.0 (percentage of step duration)
  readonly swing: number; // 0-1 (0 = no swing, 1 = full swing)
  readonly latch: boolean; // R-STA-07: continue after keys released
};

export const DEFAULT_ARP_PARAMS: ArpParams = {
  enabled: false,
  pattern: "up",
  rateDivision: "1/8",
  octaveRange: 1,
  octaveDirection: "up",
  gate: 0.8,
  swing: 0,
  latch: false,
};

export function createDefaultArpParams(): ArpParams {
  return { ...DEFAULT_ARP_PARAMS };
}

// ─── Note event output ───

export type ArpNoteEvent = {
  readonly note: number; // MIDI note 0-127
  readonly velocity: number; // 0-127
  readonly startTime: number; // audio context time (seconds)
  readonly duration: number; // seconds
};
