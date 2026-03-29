import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  decodeAudioFile,
  MAX_FILE_SIZE_BYTES,
  DECODE_TIMEOUT_MS,
} from "./decode-pipeline";

function mockAudioBuffer(opts: {
  length?: number;
  sampleRate?: number;
  numberOfChannels?: number;
  duration?: number;
}): AudioBuffer {
  const length = opts.length ?? 44100;
  const sampleRate = opts.sampleRate ?? 44100;
  const numberOfChannels = opts.numberOfChannels ?? 2;
  const duration = opts.duration ?? length / sampleRate;
  return {
    length,
    sampleRate,
    numberOfChannels,
    duration,
    getChannelData: () => new Float32Array(length),
    copyFromChannel: () => undefined,
    copyToChannel: () => undefined,
  } as unknown as AudioBuffer;
}

class MockAudioContext {
  decodeAudioData = vi.fn<[ArrayBuffer], Promise<AudioBuffer>>();
}

function wavHeader(): Uint8Array {
  const header = new Uint8Array(12);
  // RIFF
  header[0] = 0x52;
  header[1] = 0x49;
  header[2] = 0x46;
  header[3] = 0x46;
  // WAVE
  header[8] = 0x57;
  header[9] = 0x41;
  header[10] = 0x56;
  header[11] = 0x45;
  return header;
}

function makeFile(
  name: string,
  headerBytes: Uint8Array,
  totalSize?: number,
): File {
  const size = totalSize ?? headerBytes.length;
  const padding =
    size > headerBytes.length
      ? new Uint8Array(size - headerBytes.length)
      : new Uint8Array(0);
  return new File([headerBytes, padding], name);
}

let ctx: MockAudioContext;

beforeEach(() => {
  ctx = new MockAudioContext();
  vi.stubGlobal("crypto", {
    randomUUID: () => "test-uuid-1234",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("decodeAudioFile", () => {
  it("rejects files exceeding 500MB", async () => {
    const bigFile = new File(["x"], "huge.wav");
    Object.defineProperty(bigFile, "size", { value: MAX_FILE_SIZE_BYTES + 1 });

    const result = await decodeAudioFile(
      bigFile,
      ctx as unknown as BaseAudioContext,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("file-too-large");
    }
  });

  it("rejects files with unsupported magic bytes", async () => {
    const file = makeFile("mystery.bin", new Uint8Array(12));

    const result = await decodeAudioFile(
      file,
      ctx as unknown as BaseAudioContext,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("unsupported-format");
      expect(result.error.fileName).toBe("mystery.bin");
    }
  });

  it("returns DecodeError when decodeAudioData fails", async () => {
    const file = makeFile("broken.wav", wavHeader(), 1000);
    ctx.decodeAudioData.mockRejectedValue(new DOMException("decode error"));

    const result = await decodeAudioFile(
      file,
      ctx as unknown as BaseAudioContext,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("decode-failed");
      expect(result.error.fileName).toBe("broken.wav");
    }
  });

  it("successfully decodes a valid WAV file", async () => {
    const file = makeFile("kick.wav", wavHeader(), 1000);
    const buffer = mockAudioBuffer({
      sampleRate: 44100,
      numberOfChannels: 2,
      duration: 1.5,
    });
    ctx.decodeAudioData.mockResolvedValue(buffer);

    const result = await decodeAudioFile(
      file,
      ctx as unknown as BaseAudioContext,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.handle.name).toBe("kick.wav");
      expect(result.handle.format).toBe("wav");
      expect(result.handle.sampleRate).toBe(44100);
      expect(result.handle.channels).toBe(2);
      expect(result.handle.durationSeconds).toBe(1.5);
      expect(result.handle.fileSizeBytes).toBe(1000);
      expect(result.handle.id).toBe("test-uuid-1234");
      expect(result.buffer).toBe(buffer);
    }
  });

  it("detects MP3 format from ID3 header", async () => {
    const id3Header = new Uint8Array(12);
    id3Header[0] = 0x49;
    id3Header[1] = 0x44;
    id3Header[2] = 0x33; // "ID3"
    const file = makeFile("track.mp3", id3Header, 500);
    ctx.decodeAudioData.mockResolvedValue(mockAudioBuffer({}));

    const result = await decodeAudioFile(
      file,
      ctx as unknown as BaseAudioContext,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.handle.format).toBe("mp3");
    }
  });

  it("rejects empty files", async () => {
    const file = new File([], "empty.wav");

    const result = await decodeAudioFile(
      file,
      ctx as unknown as BaseAudioContext,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("unsupported-format");
    }
  });

  it("times out if decodeAudioData hangs", async () => {
    vi.useFakeTimers();
    const file = makeFile("hang.wav", wavHeader(), 1000);
    ctx.decodeAudioData.mockReturnValue(new Promise(() => {})); // never resolves

    const resultPromise = decodeAudioFile(
      file,
      ctx as unknown as BaseAudioContext,
    );

    // advanceTimersByTimeAsync also flushes pending microtasks (file.arrayBuffer etc.)
    await vi.advanceTimersByTimeAsync(DECODE_TIMEOUT_MS);
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("decode-failed");
      expect(result.error.fileName).toBe("hang.wav");
    }
    vi.useRealTimers();
  });
});
