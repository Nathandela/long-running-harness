/**
 * WAV file encoder with incremental chunk support.
 * Supports 16-bit PCM, 24-bit PCM, and 32-bit IEEE float.
 *
 * Two modes:
 * 1. Single-pass: encodeWav() for small files
 * 2. Chunked: encodeWavHeader() + encodePcmChunk()* + assembleWav()
 */

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Encode a WAV file header (44 bytes).
 * @param numChannels - Number of audio channels (1 = mono, 2 = stereo)
 * @param sampleRate - Sample rate in Hz
 * @param bitDepth - Bits per sample (16, 24, or 32)
 * @param totalSamples - Total number of sample frames (not total samples across all channels)
 */
export function encodeWavHeader(
  numChannels: number,
  sampleRate: number,
  bitDepth: 16 | 24 | 32,
  totalSamples: number,
): ArrayBuffer {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const isFloat = bitDepth === 32;
  const formatCode = isFloat ? 3 : 1; // 3 = IEEE float, 1 = PCM
  // IEEE float requires 18-byte fmt chunk (with cbSize=0); PCM uses 16
  const fmtChunkSize = isFloat ? 18 : 16;
  const headerSize = 20 + fmtChunkSize + 8; // RIFF(12) + fmt(8+fmtChunkSize) + data(8)

  const buffer = new ArrayBuffer(headerSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, headerSize - 8 + dataSize, true); // file size - 8
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, fmtChunkSize, true);
  view.setUint16(20, formatCode, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  const dataOffset = 20 + fmtChunkSize;
  if (isFloat) {
    view.setUint16(36, 0, true); // cbSize = 0
  }

  // data sub-chunk
  writeString(view, dataOffset, "data");
  view.setUint32(dataOffset + 4, dataSize, true);

  return buffer;
}

/**
 * Encode a chunk of interleaved PCM data from channel arrays.
 * @param channels - Array of Float32Arrays, one per channel
 * @param bitDepth - Bits per sample (16, 24, or 32)
 */
export function encodePcmChunk(
  channels: readonly Float32Array[],
  bitDepth: 16 | 24 | 32,
): ArrayBuffer {
  const numChannels = channels.length;
  const firstChannel = channels[0];
  if (!firstChannel || numChannels === 0) return new ArrayBuffer(0);

  const numSamples = firstChannel.length;
  const bytesPerSample = bitDepth / 8;
  const buffer = new ArrayBuffer(numSamples * numChannels * bytesPerSample);

  if (bitDepth === 16) {
    const view = new DataView(buffer);
    let offset = 0;
    for (let s = 0; s < numSamples; s++) {
      for (let c = 0; c < numChannels; c++) {
        const ch = channels[c];
        const sample = ch ? clamp(ch[s] ?? 0, -1, 1) : 0;
        const int16 = Math.round(sample < 0 ? sample * 32768 : sample * 32767);
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }
  } else if (bitDepth === 24) {
    const bytes = new Uint8Array(buffer);
    let offset = 0;
    for (let s = 0; s < numSamples; s++) {
      for (let c = 0; c < numChannels; c++) {
        const ch = channels[c];
        const sample = ch ? clamp(ch[s] ?? 0, -1, 1) : 0;
        const int24 = Math.round(
          sample < 0 ? sample * 8388608 : sample * 8388607,
        );
        bytes[offset++] = int24 & 0xff;
        bytes[offset++] = (int24 >> 8) & 0xff;
        bytes[offset++] = (int24 >> 16) & 0xff;
      }
    }
  } else {
    // 32-bit float
    const view = new DataView(buffer);
    let offset = 0;
    for (let s = 0; s < numSamples; s++) {
      for (let c = 0; c < numChannels; c++) {
        const ch = channels[c];
        view.setFloat32(offset, ch?.[s] ?? 0, true);
        offset += 4;
      }
    }
  }

  return buffer;
}

/**
 * Assemble a WAV file from a header and data chunks.
 */
export function assembleWav(
  header: ArrayBuffer,
  chunks: readonly ArrayBuffer[],
): Blob {
  return new Blob([header, ...chunks], { type: "audio/wav" });
}

/**
 * Single-pass WAV encoding: header + all data in one call.
 * @param channels - Array of Float32Arrays, one per channel
 * @param sampleRate - Sample rate in Hz
 * @param bitDepth - Bits per sample (16, 24, or 32)
 */
export function encodeWav(
  channels: readonly Float32Array[],
  sampleRate: number,
  bitDepth: 16 | 24 | 32,
): Blob {
  const firstChannel = channels[0];
  const numSamples = firstChannel?.length ?? 0;
  const header = encodeWavHeader(
    channels.length,
    sampleRate,
    bitDepth,
    numSamples,
  );
  const data = encodePcmChunk(channels, bitDepth);
  return assembleWav(header, [data]);
}
