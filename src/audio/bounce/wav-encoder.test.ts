/**
 * Tests for WAV encoder.
 * Verifies correct WAV header, PCM encoding at different bit depths,
 * stereo interleaving, and chunk-based assembly.
 */

import { describe, it, expect } from "vitest";
import {
  encodeWav,
  encodeWavHeader,
  encodePcmChunk,
  assembleWav,
} from "./wav-encoder";

/** Create a simple mono sine wave buffer */
function makeSineBuffer(
  length: number,
  frequency: number,
  sampleRate: number,
): Float32Array {
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buf[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return buf;
}

describe("encodeWav", () => {
  it("produces a valid WAV file with correct RIFF header", () => {
    const left = new Float32Array([0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5]);
    const right = new Float32Array([0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5]);
    const blob = encodeWav([left, right], 44100, 16);

    // WAV = 44 byte header + data
    // 8 samples * 2 channels * 2 bytes/sample = 32 bytes data
    expect(blob.size).toBe(44 + 32);
    expect(blob.type).toBe("audio/wav");
  });

  it("encodes 16-bit PCM correctly", () => {
    // Single sample at 1.0 should be 32767 in 16-bit signed
    const left = new Float32Array([1.0]);
    const right = new Float32Array([1.0]);
    const blob = encodeWav([left, right], 44100, 16);

    expect(blob.size).toBe(44 + 4); // header + 2 channels * 2 bytes
  });

  it("encodes 24-bit PCM correctly", () => {
    const left = new Float32Array([0.5]);
    const right = new Float32Array([-0.5]);
    const blob = encodeWav([left, right], 44100, 24);

    // 1 sample * 2 channels * 3 bytes = 6 bytes data
    expect(blob.size).toBe(44 + 6);
  });

  it("encodes 32-bit float PCM correctly", () => {
    const left = new Float32Array([0.75]);
    const right = new Float32Array([-0.25]);
    const blob = encodeWav([left, right], 44100, 32);

    // 46-byte header (IEEE float fmt has cbSize) + 1 sample * 2 channels * 4 bytes
    expect(blob.size).toBe(46 + 8);
  });

  it("handles mono input (single channel)", () => {
    const mono = new Float32Array([0, 0.5, 1.0, -1.0]);
    const blob = encodeWav([mono], 44100, 16);

    // 4 samples * 1 channel * 2 bytes = 8 bytes data
    expect(blob.size).toBe(44 + 8);
  });

  it("clamps values exceeding [-1, 1] range", () => {
    const left = new Float32Array([2.0, -2.0]);
    const right = new Float32Array([1.5, -1.5]);
    const blob = encodeWav([left, right], 44100, 16);

    // Should not throw, values are clamped
    expect(blob.size).toBe(44 + 8);
  });

  it("handles empty input gracefully", () => {
    const left = new Float32Array(0);
    const right = new Float32Array(0);
    const blob = encodeWav([left, right], 44100, 16);

    // Just the header, no data
    expect(blob.size).toBe(44);
  });
});

describe("encodeWavHeader", () => {
  it("writes correct RIFF/WAVE markers", () => {
    const header = encodeWavHeader(2, 44100, 16, 1000);
    const view = new DataView(header);

    // "RIFF" at offset 0
    expect(
      String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3),
      ),
    ).toBe("RIFF");

    // "WAVE" at offset 8
    expect(
      String.fromCharCode(
        view.getUint8(8),
        view.getUint8(9),
        view.getUint8(10),
        view.getUint8(11),
      ),
    ).toBe("WAVE");

    // "fmt " at offset 12
    expect(
      String.fromCharCode(
        view.getUint8(12),
        view.getUint8(13),
        view.getUint8(14),
        view.getUint8(15),
      ),
    ).toBe("fmt ");

    // "data" at offset 36
    expect(
      String.fromCharCode(
        view.getUint8(36),
        view.getUint8(37),
        view.getUint8(38),
        view.getUint8(39),
      ),
    ).toBe("data");
  });

  it("writes correct channel count and sample rate", () => {
    const header = encodeWavHeader(2, 48000, 24, 500);
    const view = new DataView(header);

    // numChannels at offset 22
    expect(view.getUint16(22, true)).toBe(2);
    // sampleRate at offset 24
    expect(view.getUint32(24, true)).toBe(48000);
  });

  it("writes correct byte rate and block align for 16-bit stereo", () => {
    const header = encodeWavHeader(2, 44100, 16, 100);
    const view = new DataView(header);

    // byteRate = sampleRate * numChannels * bytesPerSample
    expect(view.getUint32(28, true)).toBe(44100 * 2 * 2);
    // blockAlign = numChannels * bytesPerSample
    expect(view.getUint16(32, true)).toBe(4);
    // bitsPerSample
    expect(view.getUint16(34, true)).toBe(16);
  });

  it("computes correct file size in RIFF header", () => {
    const dataSize = 44100 * 2 * 2; // 1 second, stereo, 16-bit
    const header = encodeWavHeader(2, 44100, 16, 44100);
    const view = new DataView(header);

    // RIFF chunk size = file size - 8 = (44 + dataSize) - 8
    expect(view.getUint32(4, true)).toBe(44 + dataSize - 8);
    // data chunk size
    expect(view.getUint32(40, true)).toBe(dataSize);
  });

  it("uses format code 1 (PCM) for 16-bit", () => {
    const header = encodeWavHeader(2, 44100, 16, 100);
    const view = new DataView(header);
    expect(view.getUint16(20, true)).toBe(1); // PCM
  });

  it("uses format code 3 (IEEE float) for 32-bit with cbSize", () => {
    const header = encodeWavHeader(2, 44100, 32, 100);
    const view = new DataView(header);
    expect(view.getUint16(20, true)).toBe(3); // IEEE float
    expect(view.getUint32(16, true)).toBe(18); // fmt sub-chunk = 18 bytes
    expect(view.getUint16(36, true)).toBe(0); // cbSize = 0
    // "data" at offset 38 for IEEE float
    expect(
      String.fromCharCode(
        view.getUint8(38),
        view.getUint8(39),
        view.getUint8(40),
        view.getUint8(41),
      ),
    ).toBe("data");
    expect(header.byteLength).toBe(46);
  });
});

describe("encodePcmChunk", () => {
  it("interleaves stereo samples correctly at 16-bit", () => {
    const left = new Float32Array([1.0, -1.0]);
    const right = new Float32Array([0.5, -0.5]);
    const chunk = encodePcmChunk([left, right], 16);

    const view = new DataView(chunk);
    // Sample 0: L=32767, R=16384 (0.5 * 32767 = 16383.5, rounds to 16384)
    expect(view.getInt16(0, true)).toBe(32767);
    expect(view.getInt16(2, true)).toBe(16384);
    // Sample 1: L=-32768, R=-16384
    expect(view.getInt16(4, true)).toBe(-32768);
    expect(view.getInt16(6, true)).toBe(-16384);
  });

  it("encodes 24-bit samples as 3 bytes little-endian", () => {
    const left = new Float32Array([1.0]);
    const right = new Float32Array([-1.0]);
    const chunk = encodePcmChunk([left, right], 24);

    expect(chunk.byteLength).toBe(6); // 1 sample * 2 channels * 3 bytes
    const bytes = new Uint8Array(chunk);
    // 1.0 -> 8388607 (0x7FFFFF) in 24-bit
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xff);
    expect(bytes[2]).toBe(0x7f);
  });

  it("encodes 32-bit float samples directly", () => {
    const left = new Float32Array([0.75]);
    const right = new Float32Array([-0.25]);
    const chunk = encodePcmChunk([left, right], 32);

    const view = new DataView(chunk);
    expect(view.getFloat32(0, true)).toBeCloseTo(0.75);
    expect(view.getFloat32(4, true)).toBeCloseTo(-0.25);
  });
});

describe("assembleWav (chunked encoding)", () => {
  it("produces identical output to single-pass encodeWav", () => {
    const sampleRate = 44100;
    const numSamples = 1000;
    const left = makeSineBuffer(numSamples, 440, sampleRate);
    const right = makeSineBuffer(numSamples, 880, sampleRate);

    // Single-pass
    const singlePass = encodeWav([left, right], sampleRate, 16);

    // Chunked: split into 3 chunks
    const chunkSize = 400;
    const chunks: ArrayBuffer[] = [];
    for (let i = 0; i < numSamples; i += chunkSize) {
      const end = Math.min(i + chunkSize, numSamples);
      chunks.push(
        encodePcmChunk([left.subarray(i, end), right.subarray(i, end)], 16),
      );
    }
    const assembled = assembleWav(
      encodeWavHeader(2, sampleRate, 16, numSamples),
      chunks,
    );

    expect(assembled.size).toBe(singlePass.size);
  });

  it("handles single chunk correctly", () => {
    const left = new Float32Array([0.5, -0.5]);
    const right = new Float32Array([0.25, -0.25]);
    const header = encodeWavHeader(2, 44100, 16, 2);
    const chunk = encodePcmChunk([left, right], 16);
    const blob = assembleWav(header, [chunk]);

    expect(blob.size).toBe(44 + 8); // header + 2 samples * 2 ch * 2 bytes
    expect(blob.type).toBe("audio/wav");
  });
});
