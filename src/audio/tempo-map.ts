/**
 * Single-BPM tempo map with BBT (Bar-Beat-Tick) conversion.
 * Ticks per beat: 480 (MIDI standard PPQ).
 * Bars and beats are 1-indexed (musician convention).
 */

const TICKS_PER_BEAT = 480;

export type TimeSignature = {
  readonly numerator: number;
  readonly denominator: number;
};

export type BBT = {
  readonly bar: number;
  readonly beat: number;
  readonly tick: number;
};

export type TempoMap = {
  readonly bpm: number;
  readonly timeSignature: TimeSignature;
  readonly sampleRate: number;
  secondsToBBT(seconds: number): BBT;
  bbtToSeconds(bbt: BBT): number;
  secondsToSamples(seconds: number): number;
  samplesToSeconds(samples: number): number;
  secondsPerBeat(): number;
  beatsToSeconds(beats: number): number;
};

export function createTempoMap(
  bpm: number,
  timeSignature: TimeSignature,
  sampleRate: number,
): TempoMap {
  const spb = 60 / bpm;
  const beatsPerBar = timeSignature.numerator;

  return {
    bpm,
    timeSignature,
    sampleRate,

    secondsPerBeat(): number {
      return spb;
    },

    beatsToSeconds(beats: number): number {
      return beats * spb;
    },

    secondsToSamples(seconds: number): number {
      return seconds * sampleRate;
    },

    samplesToSeconds(samples: number): number {
      return samples / sampleRate;
    },

    secondsToBBT(seconds: number): BBT {
      const totalBeats = seconds / spb;
      const wholeBeat = Math.floor(totalBeats);
      const fractionalBeat = totalBeats - wholeBeat;

      const bar = Math.floor(wholeBeat / beatsPerBar) + 1;
      const beat = (wholeBeat % beatsPerBar) + 1;
      const tick = Math.round(fractionalBeat * TICKS_PER_BEAT);

      return { bar, beat, tick };
    },

    bbtToSeconds(bbt: BBT): number {
      const totalBeats =
        (bbt.bar - 1) * beatsPerBar +
        (bbt.beat - 1) +
        bbt.tick / TICKS_PER_BEAT;
      return totalBeats * spb;
    },
  };
}
