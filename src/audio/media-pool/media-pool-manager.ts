import type { MediaPoolStorage } from "./idb-storage";
import { decodeAudioFile, DECODE_TIMEOUT_MS } from "./decode-pipeline";
import { computeWaveformPeaks } from "./waveform-peaks";
import type {
  AudioSourceHandle,
  DecodeResult,
  MediaPool,
  WaveformPeaks,
} from "./types";

const DEFAULT_SAMPLES_PER_PEAK = 256;
export const DEFAULT_CACHE_LIMIT_BYTES = 200 * 1024 * 1024; // 200MB

function bufferByteSize(buf: AudioBuffer): number {
  return buf.length * buf.numberOfChannels * 4; // Float32 = 4 bytes
}

export function createMediaPool(
  ctx: BaseAudioContext,
  storage: MediaPoolStorage,
  cacheLimitBytes = DEFAULT_CACHE_LIMIT_BYTES,
): MediaPool {
  const sources = new Map<string, AudioSourceHandle>();
  // LRU cache: Map iteration order = insertion order; delete+re-set moves to end
  const bufferCache = new Map<string, AudioBuffer>();
  let cacheBytes = 0;

  function cacheSet(id: string, buffer: AudioBuffer): void {
    // If already cached, remove old entry first
    const existing = bufferCache.get(id);
    if (existing !== undefined) {
      cacheBytes -= bufferByteSize(existing);
      bufferCache.delete(id);
    }
    // Evict LRU entries (front of Map) until under limit
    while (
      cacheBytes + bufferByteSize(buffer) > cacheLimitBytes &&
      bufferCache.size > 0
    ) {
      const oldest = bufferCache.keys().next();
      if (oldest.done === true) break;
      const oldBuf = bufferCache.get(oldest.value);
      if (oldBuf !== undefined) cacheBytes -= bufferByteSize(oldBuf);
      bufferCache.delete(oldest.value);
    }
    bufferCache.set(id, buffer);
    cacheBytes += bufferByteSize(buffer);
  }

  function cacheGet(id: string): AudioBuffer | undefined {
    const buf = bufferCache.get(id);
    if (buf === undefined) return undefined;
    // Refresh LRU position: delete and re-insert at end
    bufferCache.delete(id);
    bufferCache.set(id, buf);
    return buf;
  }

  function cacheDelete(id: string): void {
    const buf = bufferCache.get(id);
    if (buf !== undefined) cacheBytes -= bufferByteSize(buf);
    bufferCache.delete(id);
  }

  const pool: MediaPool = {
    async init(): Promise<void> {
      const metas = await storage.getAllMeta();
      for (const meta of metas) {
        sources.set(meta.id, meta);
      }
    },

    async importFile(file: File): Promise<DecodeResult> {
      const result = await decodeAudioFile(file, ctx);
      if (!result.ok) return result;

      const { handle, buffer } = result;

      // Store blob and metadata (File extends Blob, no extra copy needed)
      try {
        await storage.putBlob(handle.id, file);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          return {
            ok: false,
            error: { kind: "storage-full", fileName: file.name },
          };
        }
        throw e;
      }
      try {
        await storage.putMeta(handle.id, handle);

        // Compute and cache peaks at default resolution
        const peaks = computeWaveformPeaks(
          buffer,
          DEFAULT_SAMPLES_PER_PEAK,
          handle.id,
        );
        await storage.putPeaks(
          `${handle.id}:${String(DEFAULT_SAMPLES_PER_PEAK)}`,
          peaks,
        );
      } catch (e: unknown) {
        // Rollback blob to prevent orphaned storage
        await storage.deleteBlob(handle.id).catch(() => {});
        throw e;
      }

      sources.set(handle.id, handle);
      cacheSet(handle.id, buffer);
      return result;
    },

    getSource(id: string): AudioSourceHandle | undefined {
      return sources.get(id);
    },

    async getAudioBuffer(id: string): Promise<AudioBuffer | undefined> {
      const cached = cacheGet(id);
      if (cached !== undefined) return cached;

      const blob = await storage.getBlob(id);
      if (blob === undefined) return undefined;

      try {
        const arrayBuffer = await blob.arrayBuffer();
        const decodePromise = ctx.decodeAudioData(arrayBuffer);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("decode-timeout"));
          }, DECODE_TIMEOUT_MS);
        });
        const decoded = await Promise.race([decodePromise, timeoutPromise]);
        cacheSet(id, decoded);
        return decoded;
      } catch {
        return undefined;
      }
    },

    async getPeaks(
      id: string,
      samplesPerPeak: number,
    ): Promise<WaveformPeaks | undefined> {
      const key = `${id}:${String(samplesPerPeak)}`;
      return storage.getPeaks(key);
    },

    listSources(): readonly AudioSourceHandle[] {
      return [...sources.values()];
    },

    async removeSource(id: string): Promise<void> {
      await storage.deleteBlob(id);
      await storage.deleteMeta(id);
      await storage.deletePeaksBySource(id);
      sources.delete(id);
      cacheDelete(id);
    },

    get count(): number {
      return sources.size;
    },
  };

  return pool;
}
