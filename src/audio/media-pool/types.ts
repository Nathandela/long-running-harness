/**
 * Core types for the media pool module.
 * Manages audio file storage, decoded buffers, and waveform peak data.
 */

export type AudioFormat = "wav" | "mp3" | "ogg" | "flac";

/** Immutable reference to a decoded audio source in the media pool. */
export type AudioSourceHandle = {
  readonly id: string;
  readonly name: string;
  readonly format: AudioFormat;
  readonly sampleRate: number;
  readonly channels: number;
  readonly durationSeconds: number;
  readonly fileSizeBytes: number;
  readonly createdAt: number;
};

/** Min/max peak pairs for waveform rendering at a given resolution. */
export type WaveformPeaks = {
  readonly sourceId: string;
  readonly samplesPerPeak: number;
  /** Interleaved [min0, max0, min1, max1, ...] */
  readonly peaks: Float32Array;
  /** Number of min/max pairs */
  readonly length: number;
};

/** Discriminated error types for media pool operations. */
export type DecodeError = {
  readonly kind: "decode-failed";
  readonly fileName: string;
  readonly format: string;
};

export type StorageFullError = {
  readonly kind: "storage-full";
  readonly fileName: string;
};

export type FileTooLargeError = {
  readonly kind: "file-too-large";
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly limitBytes: number;
};

export type ValidationError = {
  readonly kind: "unsupported-format";
  readonly fileName: string;
  readonly detectedBytes: string;
};

export type MediaPoolError =
  | DecodeError
  | StorageFullError
  | FileTooLargeError
  | ValidationError;

/** Result type for decode operations. */
export type DecodeResult =
  | {
      readonly ok: true;
      readonly handle: AudioSourceHandle;
      readonly buffer: AudioBuffer;
    }
  | { readonly ok: false; readonly error: MediaPoolError };

/** The media pool manager interface. */
export type MediaPool = {
  importFile(file: File): Promise<DecodeResult>;
  getSource(id: string): AudioSourceHandle | undefined;
  getAudioBuffer(id: string): Promise<AudioBuffer | undefined>;
  getPeaks(
    id: string,
    samplesPerPeak: number,
  ): Promise<WaveformPeaks | undefined>;
  listSources(): readonly AudioSourceHandle[];
  removeSource(id: string): Promise<void>;
  readonly count: number;
  init(): Promise<void>;
};
