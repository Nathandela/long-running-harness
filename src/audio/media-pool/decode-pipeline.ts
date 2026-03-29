import { detectAudioFormat } from "./magic-bytes";
import type { AudioSourceHandle, DecodeResult } from "./types";

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
export const DECODE_TIMEOUT_MS = 15_000;

const HEADER_BYTES = 12;

/**
 * Decode an audio file with validation gates:
 * 1. File size check (500MB limit)
 * 2. Magic-bytes format detection
 * 3. decodeAudioData
 */
export async function decodeAudioFile(
  file: File,
  ctx: BaseAudioContext,
): Promise<DecodeResult> {
  // Gate 1: file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        kind: "file-too-large",
        fileName: file.name,
        sizeBytes: file.size,
        limitBytes: MAX_FILE_SIZE_BYTES,
      },
    };
  }

  // Gate 2: magic-bytes validation
  const headerSlice = file.slice(0, HEADER_BYTES);
  const headerBuf = await headerSlice.arrayBuffer();
  const header = new Uint8Array(headerBuf);
  const format = detectAudioFormat(header);

  if (format === null) {
    return {
      ok: false,
      error: {
        kind: "unsupported-format",
        fileName: file.name,
        detectedBytes: [...header.slice(0, 4)]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" "),
      },
    };
  }

  // Gate 3: decode with timeout
  const arrayBuffer = await file.arrayBuffer();
  let audioBuffer: AudioBuffer;
  try {
    const decodePromise = ctx.decodeAudioData(arrayBuffer);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("decode-timeout"));
      }, DECODE_TIMEOUT_MS);
    });
    audioBuffer = await Promise.race([decodePromise, timeoutPromise]);
  } catch {
    return {
      ok: false,
      error: {
        kind: "decode-failed",
        fileName: file.name,
        format,
      },
    };
  }

  const handle: AudioSourceHandle = {
    id: crypto.randomUUID(),
    name: file.name,
    format,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    durationSeconds: audioBuffer.duration,
    fileSizeBytes: file.size,
    createdAt: Date.now(),
  };

  return { ok: true, handle, buffer: audioBuffer };
}
