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
      await storage.putBlob(handle.id, file);
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

      sources.set(handle.id, handle);
      return result;
    },

    getSource(id: string): AudioSourceHandle | undefined {
      return sources.get(id);
    },

    async getAudioBuffer(id: string): Promise<AudioBuffer | undefined> {
      const blob = await storage.getBlob(id);
      if (blob === undefined) return undefined;

      const arrayBuffer = await blob.arrayBuffer();
      return ctx.decodeAudioData(arrayBuffer);
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
      sources.delete(id);
      await storage.deleteBlob(id);
      await storage.deleteMeta(id);
      await storage.deletePeaksBySource(id);
    },

    get count(): number {
      return sources.size;
    },
  };

  return pool;
}
