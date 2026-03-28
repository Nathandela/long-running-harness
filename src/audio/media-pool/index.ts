export type {
  MediaPool,
  AudioSourceHandle,
  WaveformPeaks,
  AudioFormat,
  MediaPoolError,
  DecodeResult,
} from "./types";
export { detectAudioFormat } from "./magic-bytes";
export { createMediaPool } from "./media-pool-manager";
export { createInMemoryStorage, createIndexedDBStorage } from "./idb-storage";
export type { MediaPoolStorage } from "./idb-storage";
export { computeWaveformPeaks } from "./waveform-peaks";
