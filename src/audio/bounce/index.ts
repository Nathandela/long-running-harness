/**
 * Bounce/export module.
 * Offline rendering of session audio to WAV file.
 *
 * EARS: R-EVT-14, NFR-17
 */

export { createBounceEngine } from "./bounce-engine";
export type {
  BounceEngine,
  BounceProgress,
  BounceResult,
  BounceOptions,
  BounceRange,
  TrackInstrumentConfig,
} from "./types";
export { encodeWav } from "./wav-encoder";
