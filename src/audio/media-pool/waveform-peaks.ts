import type { WaveformPeaks } from "./types";

const YIELD_THRESHOLD = 100_000; // samples before we start yielding
const CHUNK_SIZE = 50_000; // samples per chunk between yields

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Compute min/max peak pairs from an AudioBuffer.
 * Uses max absolute across all channels for multi-channel buffers.
 * Yields to the event loop for large buffers to avoid blocking the main thread.
 */
export async function computeWaveformPeaks(
  buffer: AudioBuffer,
  samplesPerPeak: number,
  sourceId = "",
): Promise<WaveformPeaks> {
  if (samplesPerPeak <= 0) {
    return { sourceId, samplesPerPeak, peaks: new Float32Array(0), length: 0 };
  }
  const totalSamples = buffer.length;
  const numPeaks = Math.ceil(totalSamples / samplesPerPeak);
  const peaks = new Float32Array(numPeaks * 2);
  const shouldYield = totalSamples > YIELD_THRESHOLD;

  let samplesProcessed = 0;

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

    samplesProcessed += end - start;
    if (shouldYield && samplesProcessed >= CHUNK_SIZE) {
      samplesProcessed = 0;
      await yieldToEventLoop();
    }
  }

  return { sourceId, samplesPerPeak, peaks, length: numPeaks };
}
