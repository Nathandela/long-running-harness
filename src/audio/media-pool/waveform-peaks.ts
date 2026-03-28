import type { WaveformPeaks } from "./types";

/**
 * Compute min/max peak pairs from an AudioBuffer.
 * Uses max absolute across all channels for multi-channel buffers.
 */
export function computeWaveformPeaks(
  buffer: AudioBuffer,
  samplesPerPeak: number,
  sourceId = "",
): WaveformPeaks {
  if (samplesPerPeak <= 0) {
    return { sourceId, samplesPerPeak, peaks: new Float32Array(0), length: 0 };
  }
  const totalSamples = buffer.length;
  const numPeaks = Math.ceil(totalSamples / samplesPerPeak);
  const peaks = new Float32Array(numPeaks * 2);

  for (let p = 0; p < numPeaks; p++) {
    const start = p * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, totalSamples);
    let min = Infinity;
    let max = -Infinity;

    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const channelData = buffer.getChannelData(ch);
      for (let i = start; i < end; i++) {
        const sample = channelData[i] ?? 0;
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
    }

    peaks[p * 2] = min;
    peaks[p * 2 + 1] = max;
  }

  return { sourceId, samplesPerPeak, peaks, length: numPeaks };
}
