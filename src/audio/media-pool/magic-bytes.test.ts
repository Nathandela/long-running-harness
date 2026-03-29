import { describe, it, expect } from "vitest";
import { detectAudioFormat } from "./magic-bytes";

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

function ascii(str: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i));
  }
  return result;
}

describe("detectAudioFormat", () => {
  it("detects WAV from RIFF...WAVE header", () => {
    // RIFF + 4 bytes size + WAVE
    const header = bytes(
      ...ascii("RIFF"),
      0x00,
      0x00,
      0x00,
      0x00,
      ...ascii("WAVE"),
    );
    expect(detectAudioFormat(header)).toBe("wav");
  });

  it("detects MP3 from 0xFF 0xFB sync bytes", () => {
    const header = bytes(0xff, 0xfb, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBe("mp3");
  });

  it("detects MP3 from 0xFF 0xF3 sync bytes", () => {
    const header = bytes(0xff, 0xf3, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBe("mp3");
  });

  it("detects MP3 from 0xFF 0xF2 sync bytes", () => {
    const header = bytes(0xff, 0xf2, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBe("mp3");
  });

  it("detects MP3 from ID3v2 tag", () => {
    const header = bytes(...ascii("ID3"), 0x03, 0x00, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBe("mp3");
  });

  it("detects OGG from OggS header", () => {
    const header = bytes(...ascii("OggS"), 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBe("ogg");
  });

  it("detects FLAC from fLaC header", () => {
    const header = bytes(...ascii("fLaC"), 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBe("flac");
  });

  it("returns null for random bytes", () => {
    const header = bytes(
      0x00,
      0x01,
      0x02,
      0x03,
      0x04,
      0x05,
      0x06,
      0x07,
      0x08,
      0x09,
      0x0a,
      0x0b,
    );
    expect(detectAudioFormat(header)).toBeNull();
  });

  it("returns null for empty buffer", () => {
    expect(detectAudioFormat(new Uint8Array(0))).toBeNull();
  });

  it("returns null for short buffer", () => {
    expect(detectAudioFormat(bytes(0xff))).toBeNull();
  });

  it("rejects frame-sync with reserved MPEG version bits (0xFF 0xE8)", () => {
    // 0xE8 = 1110 1000 -> version bits 4-3 = 01 = reserved
    const header = bytes(0xff, 0xe8, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBeNull();
  });

  it("rejects frame-sync with reserved MPEG version bits (0xFF 0xEA)", () => {
    // 0xEA = 1110 1010 -> version bits 4-3 = 01 = reserved
    const header = bytes(0xff, 0xea, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBeNull();
  });

  it("accepts frame-sync with MPEG 2.5 version (0xFF 0xE0)", () => {
    // 0xE0 = 1110 0000 -> version bits 4-3 = 00 = MPEG 2.5
    const header = bytes(0xff, 0xe0, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectAudioFormat(header)).toBe("mp3");
  });

  it("returns null for RIFF with non-WAVE marker (e.g. AVI)", () => {
    const header = bytes(
      ...ascii("RIFF"),
      0x00,
      0x00,
      0x00,
      0x00,
      ...ascii("AVI "),
    );
    expect(detectAudioFormat(header)).toBeNull();
  });
});
