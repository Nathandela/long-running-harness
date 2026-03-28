import { describe, it, expect } from "vitest";
import {
  createVoiceAllocator,
  MAX_VOICES,
  STEAL_CROSSFADE_S,
  type Voice,
} from "./voice-allocator";

const SR = 48000;

/** Safe voice access for tests */
function at(voices: readonly Voice[], i: number): Voice {
  const voice = voices[i];
  if (!voice) throw new Error("Index out of bounds");
  return voice;
}

describe("Voice Allocator", () => {
  it("allocates to idle voices", () => {
    const alloc = createVoiceAllocator();
    const idx = alloc.noteOn(60, 100, false);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(MAX_VOICES);
    expect(at(alloc.voices, idx).state).toBe("active");
    expect(at(alloc.voices, idx).note).toBe(60);
    expect(at(alloc.voices, idx).velocity).toBe(100);
  });

  it("has fixed pool of 16 voices (INV-5)", () => {
    const alloc = createVoiceAllocator();
    expect(alloc.voices.length).toBe(16);
  });

  it("fills all 16 voices before stealing", () => {
    const alloc = createVoiceAllocator();
    const allocated = new Set<number>();

    for (let i = 0; i < MAX_VOICES; i++) {
      const idx = alloc.noteOn(60 + i, 100, false);
      allocated.add(idx);
    }

    expect(allocated.size).toBe(MAX_VOICES);
  });

  it("steals oldest voice when pool is full (MIT-H4-5)", () => {
    const alloc = createVoiceAllocator();

    for (let i = 0; i < MAX_VOICES; i++) {
      alloc.noteOn(60 + i, 100, false);
    }

    const stolenIdx = alloc.noteOn(90, 100, false);
    expect(at(alloc.voices, stolenIdx).note).toBe(90);
  });

  it("prefers stealing releasing voices over active", () => {
    const alloc = createVoiceAllocator();

    for (let i = 0; i < MAX_VOICES; i++) {
      alloc.noteOn(60 + i, 100, false);
    }

    const releasedIdx = alloc.noteOff(60);
    expect(releasedIdx).toBeGreaterThanOrEqual(0);
    expect(at(alloc.voices, releasedIdx).state).toBe("releasing");

    const newIdx = alloc.noteOn(90, 100, false);
    expect(newIdx).toBe(releasedIdx);
  });

  it("noteOff transitions voice to releasing", () => {
    const alloc = createVoiceAllocator();
    alloc.noteOn(60, 100, false);
    const idx = alloc.noteOff(60);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(at(alloc.voices, idx).state).toBe("releasing");
  });

  it("noteOff returns -1 for unknown note", () => {
    const alloc = createVoiceAllocator();
    expect(alloc.noteOff(99)).toBe(-1);
  });

  it("markIdle returns voice to pool", () => {
    const alloc = createVoiceAllocator();
    const idx = alloc.noteOn(60, 100, false);
    alloc.markIdle(idx);
    expect(at(alloc.voices, idx).state).toBe("idle");
    expect(at(alloc.voices, idx).note).toBe(-1);
  });

  it("steal crossfade lasts 5ms (MIT-H4-5)", () => {
    const expectedSamples = Math.floor(STEAL_CROSSFADE_S * SR);
    expect(expectedSamples).toBe(240);
  });

  it("legato mode reuses active voice", () => {
    const alloc = createVoiceAllocator();
    const idx1 = alloc.noteOn(60, 100, false);
    const idx2 = alloc.noteOn(64, 100, true);

    expect(idx2).toBe(idx1);
    expect(at(alloc.voices, idx2).note).toBe(64);
    expect(at(alloc.voices, idx2).state).toBe("active");
  });

  it("reset returns all voices to idle", () => {
    const alloc = createVoiceAllocator();
    for (let i = 0; i < 5; i++) {
      alloc.noteOn(60 + i, 100, false);
    }
    alloc.reset();

    for (let i = 0; i < MAX_VOICES; i++) {
      expect(at(alloc.voices, i).state).toBe("idle");
      expect(at(alloc.voices, i).note).toBe(-1);
    }
  });

  it("processStealFade decrements crossfade gain", () => {
    const alloc = createVoiceAllocator();

    for (let i = 0; i < MAX_VOICES; i++) {
      alloc.noteOn(60 + i, 100, false);
    }

    alloc.noteOn(90, 100, false);

    const crossfadeSamples = Math.floor(STEAL_CROSSFADE_S * SR);
    for (let i = 0; i < crossfadeSamples + 10; i++) {
      alloc.processStealFade(SR);
    }

    for (let i = 0; i < MAX_VOICES; i++) {
      expect(at(alloc.voices, i).state).not.toBe("stealing");
    }
  });
});
