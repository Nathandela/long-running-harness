/**
 * SharedArrayBuffer byte layout for lock-free audio-thread -> UI-thread communication.
 * All offsets are in bytes. Float32 values use 4-byte alignment.
 *
 * INV-3: Zero-allocation convention -- all buffers pre-allocated at init,
 * no object/array creation in the render loop.
 */

/** Byte offsets into the shared metering buffer */
export const MeteringLayout = {
  /** Master peak L (Float32) */
  MASTER_PEAK_L: 0,
  /** Master peak R (Float32) */
  MASTER_PEAK_R: 4,
  /** Master RMS L (Float32) */
  MASTER_RMS_L: 8,
  /** Master RMS R (Float32) */
  MASTER_RMS_R: 12,
  /** Per-track metering starts here. Each track: peakL, peakR, rmsL, rmsR (16 bytes) */
  TRACKS_OFFSET: 16,
  /** Bytes per track metering block */
  BYTES_PER_TRACK: 16,
} as const;

/** Byte offsets into the shared transport/cursor buffer */
export const TransportLayout = {
  /** Playback cursor position in seconds (Float64, 8 bytes) */
  CURSOR_SECONDS: 0,
  /** Transport state: 0=stopped, 1=playing, 2=paused (Uint8) */
  STATE: 8,
  /** Current BPM (Float32) */
  BPM: 12,
  /** Total size of the transport buffer */
  TOTAL_BYTES: 16,
} as const;

export type SharedArrayBufferLayout = {
  metering: SharedArrayBuffer;
  transport: SharedArrayBuffer;
};

/**
 * Creates the shared buffers for audio-thread <-> UI-thread communication.
 * @param maxTracks - Maximum number of tracks supported (default 64)
 */
export function createSharedBuffers(maxTracks = 64): SharedArrayBufferLayout {
  const meteringSize =
    MeteringLayout.TRACKS_OFFSET + maxTracks * MeteringLayout.BYTES_PER_TRACK;
  return {
    metering: new SharedArrayBuffer(meteringSize),
    transport: new SharedArrayBuffer(TransportLayout.TOTAL_BYTES),
  };
}
