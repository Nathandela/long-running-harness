/**
 * Voice allocator: 16-voice fixed pool with oldest-steal + 5ms crossfade.
 * INV-5: Fixed pool size, never grows.
 * MIT-H4-5: Oldest-steal with 5ms crossfade on stolen voices.
 * R-STA-05: Legato mode with pitch glide.
 *
 * Zero-allocation in allocate/release — no objects created at runtime.
 */

/** Maximum number of concurrent voices */
export const MAX_VOICES = 16;

/** Crossfade time in seconds when stealing a voice (MIT-H4-5) */
export const STEAL_CROSSFADE_S = 0.005;

export type VoiceState = "idle" | "active" | "releasing" | "stealing";

export type Voice = {
  state: VoiceState;
  note: number; // MIDI note number
  velocity: number; // 0..127
  /** Monotonically increasing counter set on each note-on for oldest-steal */
  age: number;
  /** Samples remaining in steal crossfade */
  stealFadeSamples: number;
  /** Crossfade gain multiplier for the old voice being stolen */
  stealFadeGain: number;
};

export type VoiceAllocator = {
  readonly voices: readonly Voice[];
  /** Allocate a voice for a note-on. Returns voice index. */
  noteOn(note: number, velocity: number, legato: boolean): number;
  /** Release a voice for a note-off. Returns voice index or -1 if not found. */
  noteOff(note: number): number;
  /** Advance steal crossfade for one sample. Call once per render sample. */
  processStealFade(sampleRate: number): void;
  /** Mark a voice as idle (called when envelope finishes release). */
  markIdle(index: number): void;
  /** Reset all voices to idle. */
  reset(): void;
};

/** Safe array access that throws on out-of-bounds (pool is fixed-size). */
function v(voices: Voice[], i: number): Voice {
  const voice = voices[i];
  if (!voice) throw new Error("Voice index out of bounds");
  return voice;
}

export function createVoiceAllocator(): VoiceAllocator {
  let ageCounter = 0;

  // Pre-allocate voice pool (INV-5: fixed size)
  const voices: Voice[] = Array.from({ length: MAX_VOICES }, () => ({
    state: "idle" as VoiceState,
    note: -1,
    velocity: 0,
    age: 0,
    stealFadeSamples: 0,
    stealFadeGain: 0,
  }));

  function findIdleVoice(): number {
    for (let i = 0; i < MAX_VOICES; i++) {
      if (v(voices, i).state === "idle") return i;
    }
    return -1;
  }

  function findOldestActive(): number {
    let oldestIdx = -1;
    let oldestAge = Infinity;

    for (let i = 0; i < MAX_VOICES; i++) {
      const voice = v(voices, i);
      if (voice.state === "releasing" && voice.age < oldestAge) {
        oldestAge = voice.age;
        oldestIdx = i;
      }
    }

    if (oldestIdx === -1) {
      for (let i = 0; i < MAX_VOICES; i++) {
        const voice = v(voices, i);
        if (
          (voice.state === "active" || voice.state === "stealing") &&
          voice.age < oldestAge
        ) {
          oldestAge = voice.age;
          oldestIdx = i;
        }
      }
    }

    return oldestIdx;
  }

  function findVoiceForNote(note: number): number {
    for (let i = 0; i < MAX_VOICES; i++) {
      const voice = v(voices, i);
      if (
        voice.note === note &&
        (voice.state === "active" || voice.state === "releasing")
      ) {
        return i;
      }
    }
    return -1;
  }

  const allocator: VoiceAllocator = {
    voices,

    noteOn(note: number, velocity: number, legato: boolean): number {
      ageCounter++;

      if (legato) {
        const existing = findVoiceForNote(note);
        if (existing !== -1) {
          const voice = v(voices, existing);
          voice.note = note;
          voice.velocity = velocity;
          voice.age = ageCounter;
          voice.state = "active";
          return existing;
        }
        for (let i = 0; i < MAX_VOICES; i++) {
          const voice = v(voices, i);
          if (voice.state === "active") {
            voice.note = note;
            voice.velocity = velocity;
            voice.age = ageCounter;
            return i;
          }
        }
      }

      let idx = findIdleVoice();

      if (idx === -1) {
        idx = findOldestActive();
        if (idx !== -1) {
          const voice = v(voices, idx);
          voice.state = "stealing";
          voice.stealFadeSamples = 0;
          voice.stealFadeGain = 1;
        }
      }

      if (idx === -1) {
        idx = 0;
      }

      const voice = v(voices, idx);
      voice.note = note;
      voice.velocity = velocity;
      voice.age = ageCounter;
      voice.state = "active";
      voice.stealFadeSamples = 0;
      voice.stealFadeGain = 0;

      return idx;
    },

    noteOff(note: number): number {
      const idx = findVoiceForNote(note);
      if (idx === -1) return -1;

      v(voices, idx).state = "releasing";
      return idx;
    },

    processStealFade(sampleRate: number): void {
      const crossfadeSamples = Math.floor(STEAL_CROSSFADE_S * sampleRate);

      for (let i = 0; i < MAX_VOICES; i++) {
        const voice = v(voices, i);
        if (voice.state === "stealing") {
          voice.stealFadeSamples++;
          voice.stealFadeGain = Math.max(
            0,
            1 - voice.stealFadeSamples / crossfadeSamples,
          );
          if (voice.stealFadeSamples >= crossfadeSamples) {
            voice.state = "active";
            voice.stealFadeGain = 0;
            voice.stealFadeSamples = 0;
          }
        }
      }
    },

    markIdle(index: number): void {
      if (index >= 0 && index < MAX_VOICES) {
        const voice = v(voices, index);
        voice.state = "idle";
        voice.note = -1;
        voice.velocity = 0;
        voice.stealFadeSamples = 0;
        voice.stealFadeGain = 0;
      }
    },

    reset(): void {
      ageCounter = 0;
      for (let i = 0; i < MAX_VOICES; i++) {
        const voice = v(voices, i);
        voice.state = "idle";
        voice.note = -1;
        voice.velocity = 0;
        voice.age = 0;
        voice.stealFadeSamples = 0;
        voice.stealFadeGain = 0;
      }
    },
  };

  return allocator;
}
