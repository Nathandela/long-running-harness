import type { AudioFormat } from "./types";

/**
 * Detect audio format from the first 12 bytes of a file.
 * Returns null if the format is unrecognized.
 */
export function detectAudioFormat(header: Uint8Array): AudioFormat | null {
  if (header.length < 2) return null;

  // FLAC: "fLaC"
  if (
    header.length >= 4 &&
    header[0] === 0x66 &&
    header[1] === 0x4c &&
    header[2] === 0x61 &&
    header[3] === 0x43
  ) {
    return "flac";
  }

  // OGG: "OggS"
  if (
    header.length >= 4 &&
    header[0] === 0x4f &&
    header[1] === 0x67 &&
    header[2] === 0x67 &&
    header[3] === 0x53
  ) {
    return "ogg";
  }

  // WAV: "RIFF" + 4 bytes + "WAVE"
  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x41 &&
    header[10] === 0x56 &&
    header[11] === 0x45
  ) {
    return "wav";
  }

  // MP3: ID3v2 tag "ID3"
  if (
    header.length >= 3 &&
    header[0] === 0x49 &&
    header[1] === 0x44 &&
    header[2] === 0x33
  ) {
    return "mp3";
  }

  // MP3: 11-bit frame sync (0xFF followed by byte with top 3 bits set)
  if (header[0] === 0xff && ((header[1] ?? 0) & 0xe0) === 0xe0) {
    return "mp3";
  }

  return null;
}
