/**
 * Modulation matrix types and registries.
 * Defines sources, destinations, and routes for the modulation system.
 *
 * Exports: ModSource, ModDestination, ModRoute, ModulationMatrix
 */

// ─── Source Registry ───

export const MOD_SOURCES = [
  "lfo1",
  "lfo2",
  "ampEnv",
  "filterEnv",
  "velocity",
  "aftertouch",
  "modWheel",
  "pitchBend",
] as const;

export type ModSource = (typeof MOD_SOURCES)[number];

/** Per-voice sources have a different value per active voice */
const PER_VOICE_SOURCES: ReadonlySet<ModSource> = new Set([
  "velocity",
  "ampEnv",
  "filterEnv",
]);

export function isPerVoiceSource(source: ModSource): boolean {
  return PER_VOICE_SOURCES.has(source);
}

// ─── Destination Registry ───

export const MOD_DESTINATIONS = [
  "osc1Pitch",
  "osc2Pitch",
  "oscMix",
  "filterCutoff",
  "filterResonance",
  "ampLevel",
  "lfo1Rate",
  "lfo2Rate",
] as const;

export type ModDestination = (typeof MOD_DESTINATIONS)[number];

// ─── Route ───

export type ModRoute = {
  readonly id: string;
  readonly source: ModSource;
  readonly destination: ModDestination;
  readonly amount: number; // -1..+1
  readonly bipolar: boolean;
};

let routeCounter = 0;

export function createModRoute(
  source: ModSource,
  destination: ModDestination,
  amount = 0,
  bipolar = true,
): ModRoute {
  return {
    id: `mod-${String(++routeCounter)}-${String(Date.now())}`,
    source,
    destination,
    amount: Math.max(-1, Math.min(1, amount)),
    bipolar,
  };
}

// ─── Matrix (collection of routes) ───

export type ModulationMatrix = {
  readonly routes: readonly ModRoute[];
};

export const EMPTY_MATRIX: ModulationMatrix = { routes: [] };

/** Max number of simultaneous routes */
export const MAX_MOD_ROUTES = 32;
