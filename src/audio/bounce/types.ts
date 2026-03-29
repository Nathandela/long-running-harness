/**
 * Types for the bounce/export system.
 * Offline rendering of the session to WAV file.
 *
 * EARS: R-EVT-14, NFR-17
 * Exports: BounceEngine, BounceProgress
 */

import type {
  AudioClipModel,
  MidiClipModel,
  TrackModel,
} from "@state/track/types";
import type { AutomationLane } from "@audio/automation/automation-types";
import type {
  DrumInstrumentId,
  DrumInstrumentParams,
} from "@audio/drum-machine/drum-types";
import type { SynthParameterMap } from "@audio/synth/synth-types";

/** Bounce range: either full session or a specific time region */
export type BounceRange =
  | { readonly type: "full" }
  | { readonly type: "region"; readonly start: number; readonly end: number };

/** Per-track instrument configuration for offline rendering */
export type TrackInstrumentConfig =
  | { readonly type: "audio" }
  | {
      readonly type: "synth";
      readonly params: SynthParameterMap;
    }
  | {
      readonly type: "drums";
      readonly samples: ReadonlyMap<DrumInstrumentId, AudioBuffer>;
      readonly params: ReadonlyMap<DrumInstrumentId, DrumInstrumentParams>;
    };

/** Options for a bounce operation */
export type BounceOptions = {
  readonly sampleRate: number;
  readonly bitDepth: 16 | 24 | 32;
  readonly range: BounceRange;
  readonly tracks: readonly TrackModel[];
  readonly clips: Readonly<Record<string, AudioClipModel | MidiClipModel>>;
  readonly automationLanes: readonly AutomationLane[];
  readonly masterLevel: number;
  readonly getBuffer: (sourceId: string) => AudioBuffer | undefined;
  readonly instruments: ReadonlyMap<string, TrackInstrumentConfig>;
};

/** Progress update during bounce */
export type BounceProgress = {
  readonly phase: "preparing" | "rendering" | "encoding" | "complete";
  readonly progress: number; // 0..1
  readonly renderedSeconds: number;
  readonly totalSeconds: number;
};

/** Result of a successful bounce */
export type BounceResult = {
  readonly blob: Blob;
  readonly duration: number;
  readonly sampleRate: number;
  readonly channels: number;
};

/** Bounce engine interface */
export type BounceEngine = {
  /** Start a bounce operation. Returns async iterable of progress updates. */
  bounce(options: BounceOptions): AsyncGenerator<BounceProgress, BounceResult>;
  /** Cancel the current bounce operation. */
  cancel(): void;
};
