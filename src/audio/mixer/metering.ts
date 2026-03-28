/**
 * Metering utilities for peak + RMS computation.
 * Clip indicator with latching (R-UNW-01).
 * Emergency mute on sustained clipping >500ms (R-UNW-05).
 *
 * NFR-13: High-frequency UI bypasses React -- reads from SharedArrayBuffer via rAF.
 */

export const CLIP_THRESHOLD = 1.0;
export const EMERGENCY_MUTE_MS = 500;

export type PeakRms = {
  peak: number;
  rms: number;
};

/** Compute peak and RMS from time-domain sample data */
export function computePeakAndRms(data: Float32Array): PeakRms {
  let peak = 0;
  let sumSquares = 0;
  const len = data.length;

  for (let i = 0; i < len; i++) {
    const sample = data[i] ?? 0;
    const abs = Math.abs(sample);
    if (abs > peak) peak = abs;
    sumSquares += sample * sample;
  }

  const rms = len > 0 ? Math.sqrt(sumSquares / len) : 0;
  return { peak, rms };
}

export type MeterUpdateResult = {
  emergencyMute: boolean;
};

/**
 * Per-channel meter state with clip latching and emergency mute tracking.
 */
export class MeterState {
  peak = 0;
  rms = 0;
  clipping = false;
  private clipDurationMs = 0;

  clearClip(): void {
    this.clipping = false;
    this.clipDurationMs = 0;
  }
}

/**
 * Update meter state with new peak/rms values.
 * @param state - Meter state to update (mutated in place)
 * @param peak - Current peak level
 * @param rms - Current RMS level
 * @param deltaMs - Time since last update in milliseconds
 * @returns Whether emergency mute should be triggered
 */
export function updateMeterState(
  state: MeterState,
  peak: number,
  rms: number,
  deltaMs: number,
): MeterUpdateResult {
  state.peak = peak;
  state.rms = rms;

  if (peak >= CLIP_THRESHOLD) {
    state.clipping = true;
    state.clipDurationMs += deltaMs;
  } else {
    state.clipDurationMs = 0;
  }

  return {
    emergencyMute: state.clipDurationMs >= EMERGENCY_MUTE_MS,
  };
}

/**
 * Read metering data from an AnalyserNode.
 * Pre-allocates the Float32Array to avoid GC in the render loop (INV-3).
 */
export function createAnalyserReader(analyser: AnalyserNode): {
  read(): PeakRms;
} {
  const buffer = new Float32Array(analyser.fftSize);

  return {
    read(): PeakRms {
      analyser.getFloatTimeDomainData(buffer);
      return computePeakAndRms(buffer);
    },
  };
}
