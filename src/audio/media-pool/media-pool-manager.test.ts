import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMediaPool,
  DEFAULT_CACHE_LIMIT_BYTES,
} from "./media-pool-manager";
import { createInMemoryStorage } from "./idb-storage";
import type { MediaPool, AudioSourceHandle } from "./types";

function wavHeader(): Uint8Array {
  const header = new Uint8Array(12);
  header[0] = 0x52;
  header[1] = 0x49;
  header[2] = 0x46;
  header[3] = 0x46;
  header[8] = 0x57;
  header[9] = 0x41;
  header[10] = 0x56;
  header[11] = 0x45;
  return header;
}

function makeWavFile(name: string, size = 1000): File {
  const header = wavHeader();
  const padding = new Uint8Array(size - header.length);
  return new File([header, padding], name);
}

function mockAudioBuffer(opts?: {
  length?: number;
  sampleRate?: number;
  numberOfChannels?: number;
  duration?: number;
}): AudioBuffer {
  const length = opts?.length ?? 44100;
  const sampleRate = opts?.sampleRate ?? 44100;
  const numberOfChannels = opts?.numberOfChannels ?? 2;
  const duration = opts?.duration ?? length / sampleRate;
  const channelData = new Float32Array(length);
  return {
    length,
    sampleRate,
    numberOfChannels,
    duration,
    getChannelData: () => channelData,
    copyFromChannel: () => undefined,
    copyToChannel: () => undefined,
  } as unknown as AudioBuffer;
}

class MockAudioContext {
  decodeAudioData = vi.fn<[ArrayBuffer], Promise<AudioBuffer>>();
  sampleRate = 44100;
}

let pool: MediaPool;
let ctx: MockAudioContext;
let idCounter: number;

beforeEach(() => {
  ctx = new MockAudioContext();
  ctx.decodeAudioData.mockResolvedValue(mockAudioBuffer());
  idCounter = 0;
  vi.stubGlobal("crypto", {
    randomUUID: () => `id-${String(++idCounter)}`,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createMediaPool", () => {
  beforeEach(async () => {
    const storage = createInMemoryStorage();
    pool = createMediaPool(ctx as unknown as BaseAudioContext, storage);
    await pool.init();
  });

  it("starts with zero sources", () => {
    expect(pool.count).toBe(0);
    expect(pool.listSources()).toHaveLength(0);
  });

  it("importFile stores and returns handle on success", async () => {
    const file = makeWavFile("kick.wav");
    const result = await pool.importFile(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.handle.name).toBe("kick.wav");
      expect(result.handle.format).toBe("wav");
    }
    expect(pool.count).toBe(1);
  });

  it("importFile propagates decode failure", async () => {
    ctx.decodeAudioData.mockRejectedValue(new DOMException("bad"));
    const file = makeWavFile("bad.wav");
    const result = await pool.importFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("decode-failed");
    }
    expect(pool.count).toBe(0);
  });

  it("getSource returns handle after import", async () => {
    const file = makeWavFile("snare.wav");
    const result = await pool.importFile(file);
    if (!result.ok) throw new Error("unexpected");

    const source = pool.getSource(result.handle.id);
    expect(source).toBeDefined();
    expect(source?.name).toBe("snare.wav");
  });

  it("getSource returns undefined for unknown ID", () => {
    expect(pool.getSource("nonexistent")).toBeUndefined();
  });

  it("listSources returns all imported sources", async () => {
    await pool.importFile(makeWavFile("a.wav"));
    await pool.importFile(makeWavFile("b.wav"));

    const sources = pool.listSources();
    expect(sources).toHaveLength(2);
  });

  it("removeSource deletes from storage and memory", async () => {
    const result = await pool.importFile(makeWavFile("del.wav"));
    if (!result.ok) throw new Error("unexpected");

    await pool.removeSource(result.handle.id);
    expect(pool.count).toBe(0);
    expect(pool.getSource(result.handle.id)).toBeUndefined();
  });

  it("getAudioBuffer returns cached buffer without re-decoding", async () => {
    const result = await pool.importFile(makeWavFile("re.wav"));
    if (!result.ok) throw new Error("unexpected");

    const buf = await pool.getAudioBuffer(result.handle.id);
    expect(buf).toBeDefined();
    // decodeAudioData called only once (during import); getAudioBuffer uses cache
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("getAudioBuffer returns undefined for unknown ID", async () => {
    const buf = await pool.getAudioBuffer("nonexistent");
    expect(buf).toBeUndefined();
  });

  it("getAudioBuffer returns undefined when re-decode fails", async () => {
    const storage = createInMemoryStorage();
    // Cache fits exactly 1 buffer; second import evicts the first
    const oneBufferBytes = 44100 * 2 * 4; // 352,800
    const tinyPool = createMediaPool(
      ctx as unknown as BaseAudioContext,
      storage,
      oneBufferBytes,
    );
    await tinyPool.init();

    const result = await tinyPool.importFile(makeWavFile("first.wav"));
    if (!result.ok) throw new Error("unexpected");

    // Import second file to evict the first from cache
    await tinyPool.importFile(makeWavFile("second.wav"));

    // Re-decode of first file will fail
    ctx.decodeAudioData.mockRejectedValueOnce(new DOMException("corrupt"));
    const buf = await tinyPool.getAudioBuffer(result.handle.id);
    expect(buf).toBeUndefined();
  });

  it("getAudioBuffer returns undefined when re-decode times out", async () => {
    vi.useFakeTimers();
    const storage = createInMemoryStorage();
    const oneBufferBytes = 44100 * 2 * 4;
    const tinyPool = createMediaPool(
      ctx as unknown as BaseAudioContext,
      storage,
      oneBufferBytes,
    );
    await tinyPool.init();

    const result = await tinyPool.importFile(makeWavFile("slow.wav"));
    if (!result.ok) throw new Error("unexpected");

    // Evict from cache
    await tinyPool.importFile(makeWavFile("other.wav"));

    // Make re-decode hang
    ctx.decodeAudioData.mockReturnValue(new Promise(() => {}));
    const bufPromise = tinyPool.getAudioBuffer(result.handle.id);

    await vi.advanceTimersByTimeAsync(15_000);
    const buf = await bufPromise;
    expect(buf).toBeUndefined();
    vi.useRealTimers();
  });

  it("getPeaks returns cached peaks", async () => {
    const result = await pool.importFile(makeWavFile("peaks.wav"));
    if (!result.ok) throw new Error("unexpected");

    const peaks = await pool.getPeaks(result.handle.id, 256);
    expect(peaks).toBeDefined();
    expect(peaks?.samplesPerPeak).toBe(256);
  });

  describe("LRU buffer cache eviction", () => {
    it("evicts least-recently-used buffer when cache exceeds limit", async () => {
      // Each buffer: length=44100, 2 channels, 4 bytes/sample = 352,800 bytes
      // Import enough files to exceed 200MB, check that oldest is evicted
      const bytesPerBuffer = 44100 * 2 * 4; // 352,800
      const buffersToFill = Math.ceil(
        DEFAULT_CACHE_LIMIT_BYTES / bytesPerBuffer,
      );

      // Import buffersToFill + 1 files to trigger eviction
      for (let i = 0; i <= buffersToFill; i++) {
        await pool.importFile(makeWavFile(`file-${String(i)}.wav`));
      }

      // First imported file should have been evicted from cache
      // but still available via re-decode from storage
      const firstId = `id-1`;
      const buf = await pool.getAudioBuffer(firstId);
      expect(buf).toBeDefined();
      // decodeAudioData called buffersToFill+1 times for imports, +1 for re-decode
      expect(ctx.decodeAudioData).toHaveBeenCalledTimes(buffersToFill + 2);
    });

    it("does not evict when cache is under limit", async () => {
      await pool.importFile(makeWavFile("a.wav"));
      await pool.importFile(makeWavFile("b.wav"));

      // Both should be cached (no re-decode needed)
      const buf1 = await pool.getAudioBuffer("id-1");
      const buf2 = await pool.getAudioBuffer("id-2");
      expect(buf1).toBeDefined();
      expect(buf2).toBeDefined();
      // Only 2 decode calls (one per import, no re-decode)
      expect(ctx.decodeAudioData).toHaveBeenCalledTimes(2);
    });

    it("getAudioBuffer refreshes LRU access order", async () => {
      const bytesPerBuffer = 44100 * 2 * 4;
      const buffersToFill = Math.ceil(
        DEFAULT_CACHE_LIMIT_BYTES / bytesPerBuffer,
      );

      // Import buffersToFill files
      for (let i = 0; i < buffersToFill; i++) {
        await pool.importFile(makeWavFile(`file-${String(i)}.wav`));
      }

      // Access the first file to refresh it in LRU
      await pool.getAudioBuffer("id-1");

      // Import one more to trigger eviction
      await pool.importFile(makeWavFile("overflow.wav"));

      // id-1 was refreshed, so id-2 should be evicted instead
      // Accessing id-1 should NOT require re-decode
      const decodeCountBefore = ctx.decodeAudioData.mock.calls.length;
      await pool.getAudioBuffer("id-1");
      expect(ctx.decodeAudioData).toHaveBeenCalledTimes(decodeCountBefore);
    });
  });

  it("init loads existing metadata from storage", async () => {
    const storage = createInMemoryStorage();
    const handle: AudioSourceHandle = {
      id: "pre-existing",
      name: "old.wav",
      format: "wav",
      sampleRate: 44100,
      channels: 2,
      durationSeconds: 3.0,
      fileSizeBytes: 500,
      createdAt: Date.now(),
    };
    await storage.putMeta(handle.id, handle);

    const pool2 = createMediaPool(ctx as unknown as BaseAudioContext, storage);
    await pool2.init();

    expect(pool2.count).toBe(1);
    expect(pool2.getSource("pre-existing")?.name).toBe("old.wav");
  });
});
