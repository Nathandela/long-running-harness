import { describe, it, expect } from "vitest";
import {
  MeteringLayout,
  TransportLayout,
  createSharedBuffers,
} from "./shared-buffer-layout";

describe("MeteringLayout", () => {
  it("has 4-byte aligned Float32 offsets", () => {
    expect(MeteringLayout.MASTER_PEAK_L % 4).toBe(0);
    expect(MeteringLayout.MASTER_PEAK_R % 4).toBe(0);
    expect(MeteringLayout.MASTER_RMS_L % 4).toBe(0);
    expect(MeteringLayout.MASTER_RMS_R % 4).toBe(0);
  });

  it("tracks offset starts after master meters (16 bytes)", () => {
    expect(MeteringLayout.TRACKS_OFFSET).toBe(16);
  });

  it("each track block is 16 bytes (peak L/R + RMS L/R as Float32)", () => {
    expect(MeteringLayout.BYTES_PER_TRACK).toBe(16);
  });
});

describe("TransportLayout", () => {
  it("cursor uses 8-byte Float64", () => {
    expect(TransportLayout.CURSOR_SECONDS).toBe(0);
    expect(TransportLayout.STATE).toBe(8);
  });

  it("BPM is 4-byte aligned", () => {
    expect(TransportLayout.BPM % 4).toBe(0);
  });

  it("total size accounts for all fields", () => {
    expect(TransportLayout.TOTAL_BYTES).toBe(16);
  });
});

describe("createSharedBuffers", () => {
  it("creates metering buffer with correct size for default 64 tracks", () => {
    const buffers = createSharedBuffers();
    const expectedSize = 16 + 64 * 16; // master (16) + 64 tracks * 16 bytes each
    expect(buffers.metering.byteLength).toBe(expectedSize);
  });

  it("creates transport buffer with fixed size", () => {
    const buffers = createSharedBuffers();
    expect(buffers.transport.byteLength).toBe(16);
  });

  it("respects custom track count", () => {
    const buffers = createSharedBuffers(8);
    expect(buffers.metering.byteLength).toBe(16 + 8 * 16);
  });

  it("buffers are SharedArrayBuffer instances", () => {
    const buffers = createSharedBuffers();
    expect(buffers.metering).toBeInstanceOf(SharedArrayBuffer);
    expect(buffers.transport).toBeInstanceOf(SharedArrayBuffer);
  });
});
