import { describe, it, expect } from "vitest";
import { computeWaveformPeaks } from "./waveform-peaks";

function mockAudioBuffer(
  channelData: Float32Array[],
  sampleRate = 44100,
): AudioBuffer {
  return {
    numberOfChannels: channelData.length,
    length: channelData[0]?.length ?? 0,
    sampleRate,
    duration: (channelData[0]?.length ?? 0) / sampleRate,
    getChannelData(ch: number): Float32Array {
      const data = channelData[ch];
      if (data === undefined) throw new RangeError("Invalid channel");
      return data;
    },
    copyFromChannel: () => undefined,
    copyToChannel: () => undefined,
  } as unknown as AudioBuffer;
}

describe("computeWaveformPeaks", () => {
  it("computes constant-value buffer peaks", async () => {
    const data = new Float32Array(8).fill(0.5);
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 4);

    expect(result.length).toBe(2);
    expect(result.samplesPerPeak).toBe(4);
    // Both min and max should be 0.5
    expect(result.peaks[0]).toBeCloseTo(0.5);
    expect(result.peaks[1]).toBeCloseTo(0.5);
  });

  it("computes alternating +1/-1 buffer peaks", async () => {
    const data = new Float32Array([1, -1, 1, -1]);
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 2);

    expect(result.length).toBe(2);
    // Each chunk of 2: [1, -1] -> min=-1, max=1
    expect(result.peaks[0]).toBeCloseTo(-1);
    expect(result.peaks[1]).toBeCloseTo(1);
  });

  it("computes silence as zero pairs", async () => {
    const data = new Float32Array(8);
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 4);

    expect(result.length).toBe(2);
    expect(result.peaks[0]).toBe(0);
    expect(result.peaks[1]).toBe(0);
  });

  it("samplesPerPeak=1 produces one pair per sample", async () => {
    const data = new Float32Array([0.1, 0.5, -0.3]);
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 1);

    expect(result.length).toBe(3);
    expect(result.peaks[0]).toBeCloseTo(0.1); // min
    expect(result.peaks[1]).toBeCloseTo(0.1); // max
    expect(result.peaks[2]).toBeCloseTo(0.5);
    expect(result.peaks[3]).toBeCloseTo(0.5);
    expect(result.peaks[4]).toBeCloseTo(-0.3);
    expect(result.peaks[5]).toBeCloseTo(-0.3);
  });

  it("handles partial last chunk", async () => {
    // 5 samples, samplesPerPeak=4 -> 2 chunks (4 + 1)
    const data = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.9]);
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 4);

    expect(result.length).toBe(2);
    // First chunk: min=0.1, max=0.4
    expect(result.peaks[0]).toBeCloseTo(0.1);
    expect(result.peaks[1]).toBeCloseTo(0.4);
    // Second chunk (partial): min=0.9, max=0.9
    expect(result.peaks[2]).toBeCloseTo(0.9);
    expect(result.peaks[3]).toBeCloseTo(0.9);
  });

  it("uses max absolute across channels for multi-channel", async () => {
    const ch0 = new Float32Array([0.2, -0.3, 0.1, 0.4]);
    const ch1 = new Float32Array([0.5, -0.1, 0.8, -0.9]);
    const buffer = mockAudioBuffer([ch0, ch1]);
    const result = await computeWaveformPeaks(buffer, 4);

    expect(result.length).toBe(1);
    // min across both channels: min(-0.3, -0.9) = -0.9
    // max across both channels: max(0.4, 0.8) = 0.8
    expect(result.peaks[0]).toBeCloseTo(-0.9);
    expect(result.peaks[1]).toBeCloseTo(0.8);
  });

  it("returns correct sourceId", async () => {
    const data = new Float32Array(4);
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 4, "test-id");

    expect(result.sourceId).toBe("test-id");
  });

  it("returns empty peaks for samplesPerPeak = 0", async () => {
    const data = new Float32Array(4);
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 0);

    expect(result.length).toBe(0);
    expect(result.peaks).toHaveLength(0);
  });

  it("computes correct peaks for large buffer (> 100K samples)", async () => {
    // 200,000 samples: alternating 0.5 / -0.5
    const data = new Float32Array(200_000);
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 2 === 0 ? 0.5 : -0.5;
    }
    const buffer = mockAudioBuffer([data]);
    const result = await computeWaveformPeaks(buffer, 256);

    // 200000 / 256 = 782 peaks (ceil)
    expect(result.length).toBe(Math.ceil(200_000 / 256));
    // Each chunk has both 0.5 and -0.5
    expect(result.peaks[0]).toBeCloseTo(-0.5);
    expect(result.peaks[1]).toBeCloseTo(0.5);
  });
});
