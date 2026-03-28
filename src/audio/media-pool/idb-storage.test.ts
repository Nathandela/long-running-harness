import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryStorage, type MediaPoolStorage } from "./idb-storage";
import type { AudioSourceHandle, WaveformPeaks } from "./types";

const MOCK_HANDLE: AudioSourceHandle = {
  id: "test-1",
  name: "kick.wav",
  format: "wav",
  sampleRate: 44100,
  channels: 2,
  durationSeconds: 1.5,
  fileSizeBytes: 264_600,
  createdAt: 1711632000000,
};

const MOCK_PEAKS: WaveformPeaks = {
  sourceId: "test-1",
  samplesPerPeak: 256,
  peaks: new Float32Array([0.1, 0.5, -0.3, 0.8]),
  length: 2,
};

describe("MediaPoolStorage (in-memory)", () => {
  let storage: MediaPoolStorage;

  beforeEach(() => {
    storage = createInMemoryStorage();
  });

  describe("metadata", () => {
    it("putMeta + getMeta roundtrip", async () => {
      await storage.putMeta(MOCK_HANDLE.id, MOCK_HANDLE);
      const result = await storage.getMeta(MOCK_HANDLE.id);
      expect(result).toEqual(MOCK_HANDLE);
    });

    it("getMeta returns undefined for unknown ID", async () => {
      const result = await storage.getMeta("nonexistent");
      expect(result).toBeUndefined();
    });

    it("getAllMeta returns all stored entries", async () => {
      const handle2: AudioSourceHandle = {
        ...MOCK_HANDLE,
        id: "test-2",
        name: "snare.wav",
      };
      await storage.putMeta(MOCK_HANDLE.id, MOCK_HANDLE);
      await storage.putMeta(handle2.id, handle2);
      const all = await storage.getAllMeta();
      expect(all).toHaveLength(2);
    });

    it("deleteMeta removes entry", async () => {
      await storage.putMeta(MOCK_HANDLE.id, MOCK_HANDLE);
      await storage.deleteMeta(MOCK_HANDLE.id);
      const result = await storage.getMeta(MOCK_HANDLE.id);
      expect(result).toBeUndefined();
    });
  });

  describe("blobs", () => {
    it("putBlob + getBlob roundtrip", async () => {
      const blob = new Blob(["audio data"], { type: "audio/wav" });
      await storage.putBlob("test-1", blob);
      const result = await storage.getBlob("test-1");
      expect(result).toBeInstanceOf(Blob);
      expect(await result?.text()).toBe("audio data");
    });

    it("getBlob returns undefined for unknown ID", async () => {
      const result = await storage.getBlob("nonexistent");
      expect(result).toBeUndefined();
    });

    it("deleteBlob removes entry", async () => {
      const blob = new Blob(["data"]);
      await storage.putBlob("test-1", blob);
      await storage.deleteBlob("test-1");
      const result = await storage.getBlob("test-1");
      expect(result).toBeUndefined();
    });
  });

  describe("peaks", () => {
    it("putPeaks + getPeaks roundtrip", async () => {
      const key = "test-1:256";
      await storage.putPeaks(key, MOCK_PEAKS);
      const result = await storage.getPeaks(key);
      expect(result).toEqual(MOCK_PEAKS);
    });

    it("getPeaks returns undefined for unknown key", async () => {
      const result = await storage.getPeaks("nonexistent");
      expect(result).toBeUndefined();
    });

    it("deletePeaksBySource removes all peaks for a source", async () => {
      await storage.putPeaks("test-1:256", MOCK_PEAKS);
      await storage.putPeaks("test-1:512", {
        ...MOCK_PEAKS,
        samplesPerPeak: 512,
      });
      await storage.deletePeaksBySource("test-1");
      expect(await storage.getPeaks("test-1:256")).toBeUndefined();
      expect(await storage.getPeaks("test-1:512")).toBeUndefined();
    });
  });
});
