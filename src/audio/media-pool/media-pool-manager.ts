import type { MediaPoolStorage } from "./idb-storage";
import { decodeAudioFile } from "./decode-pipeline";
import { computeWaveformPeaks } from "./waveform-peaks";
import type {
  AudioSourceHandle,
  DecodeResult,
  MediaPool,
  WaveformPeaks,
} from "./types";

const DEFAULT_SAMPLES_PER_PEAK = 256;

export function createMediaPool(
  ctx: BaseAudioContext,
  storage: MediaPoolStorage,
): MediaPool {
  const sources = new Map<string, AudioSourceHandle>();
  const bufferCache = new Map<string, AudioBuffer>();

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
      bufferCache.set(handle.id, buffer);
      return result;
    },

    getSource(id: string): AudioSourceHandle | undefined {
      return sources.get(id);
    },

    async getAudioBuffer(id: string): Promise<AudioBuffer | undefined> {
      const cached = bufferCache.get(id);
      if (cached !== undefined) return cached;

      const blob = await storage.getBlob(id);
      if (blob === undefined) return undefined;

      const arrayBuffer = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.set(id, decoded);
      return decoded;
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
      bufferCache.delete(id);
    },

    get count(): number {
      return sources.size;
    },
  };

  return pool;
}
