/**
 * Arpeggiator engine: generates note events from held MIDI notes.
 * Pure logic - no audio thread code. Driven by external scheduler via scheduleStep().
 *
 * Patterns: up, down, up-down, down-up, random, as-played.
 * Octave expansion with direction control. Gate, swing, latch mode.
 *
 * EARS: R-EVT-15, R-STA-07 (latch)
 */

import type { ArpNoteEvent, ArpParams } from "./arpeggiator-types";

export type Arpeggiator = {
  /** Add a held note */
  noteOn(note: number, velocity: number): void;
  /** Release a held note */
  noteOff(note: number): void;
  /** Release all held notes */
  allNotesOff(): void;
  /** Schedule one arpeggiator step at the given time */
  scheduleStep(stepIndex: number, time: number, stepDuration: number): void;
  /** Get currently held notes (sorted ascending for "up" etc.) */
  getHeldNotes(): readonly number[];
  /** Update parameters */
  setParams(params: ArpParams): void;
  /** Reset step counter and internal state */
  reset(): void;
};

type HeldNote = {
  note: number;
  velocity: number;
  order: number; // insertion order for "as-played"
};

export function createArpeggiator(
  onNote: (event: ArpNoteEvent) => void,
  initialParams: ArpParams,
): Arpeggiator {
  let params = { ...initialParams };
  let heldNotes: HeldNote[] = [];
  let latchedNotes: HeldNote[] = [];
  let isLatched = false; // true when all keys released while latch is on
  let latchSnapshot: HeldNote[] = []; // snapshot taken while keys are held
  let insertionCounter = 0;
  let stepCounter = 0; // internal step for pattern position tracking

  /** Get the active note pool (held or latched) */
  function getPool(): HeldNote[] {
    if (params.latch && isLatched && latchedNotes.length > 0) {
      return latchedNotes;
    }
    return heldNotes;
  }

  /** Build the expanded note sequence for current pool + octave settings */
  function buildSequence(): { note: number; velocity: number }[] {
    const pool = getPool();
    if (pool.length === 0) return [];

    // Sort by pattern
    let sorted: HeldNote[];
    if (params.pattern === "as-played") {
      sorted = [...pool].sort((a, b) => a.order - b.order);
    } else {
      sorted = [...pool].sort((a, b) => a.note - b.note);
    }

    // Build octave-expanded sequence
    const range = Math.max(1, Math.min(4, params.octaveRange));
    const octaves = buildOctaveSequence(range, params.octaveDirection);
    const expanded: { note: number; velocity: number }[] = [];

    for (const octOffset of octaves) {
      for (const h of sorted) {
        const n = h.note + octOffset * 12;
        if (n >= 0 && n <= 127) {
          expanded.push({ note: n, velocity: h.velocity });
        }
      }
    }

    return expanded;
  }

  /** Get the note at the given pattern index from the sequence */
  function getNoteAtStep(
    seq: { note: number; velocity: number }[],
    step: number,
  ): { note: number; velocity: number } | undefined {
    if (seq.length === 0) return undefined;

    switch (params.pattern) {
      case "up":
      case "as-played":
        return seq[step % seq.length];

      case "down": {
        const idx = seq.length - 1 - (step % seq.length);
        return seq[idx];
      }

      case "up-down": {
        if (seq.length <= 1) return seq[0];
        const bounce = buildBounceSequence(seq.length);
        const bounceIdx = bounce[step % bounce.length];
        return bounceIdx !== undefined ? seq[bounceIdx] : undefined;
      }

      case "down-up": {
        if (seq.length <= 1) return seq[0];
        const bounce = buildBounceSequence(seq.length);
        const reversed = bounce.map((i) => seq.length - 1 - i);
        const revIdx = reversed[step % reversed.length];
        return revIdx !== undefined ? seq[revIdx] : undefined;
      }

      case "random":
        return seq[Math.floor(Math.random() * seq.length)];

      default:
        return seq[step % seq.length];
    }
  }

  const arp: Arpeggiator = {
    noteOn(note: number, velocity: number): void {
      // If latched and new note arrives, clear latch pool and start fresh
      if (params.latch && isLatched && heldNotes.length === 0) {
        latchedNotes = [];
        latchSnapshot = [];
        isLatched = false;
        stepCounter = 0;
      }

      // Don't add duplicates
      if (heldNotes.some((h) => h.note === note)) return;

      heldNotes.push({ note, velocity, order: insertionCounter++ });

      // Keep a live snapshot of the held pool for latch
      if (params.latch) {
        latchSnapshot = heldNotes.map((h) => ({ ...h }));
      }
    },

    noteOff(note: number): void {
      const idx = heldNotes.findIndex((h) => h.note === note);
      if (idx === -1) return;

      heldNotes.splice(idx, 1);

      // If latch is on and all keys released, freeze from snapshot
      if (params.latch && heldNotes.length === 0 && !isLatched) {
        latchedNotes = latchSnapshot;
        isLatched = true;
      }
    },

    allNotesOff(): void {
      heldNotes = [];
      latchedNotes = [];
      latchSnapshot = [];
      isLatched = false;
      stepCounter = 0;
    },

    scheduleStep(stepIndex: number, time: number, stepDuration: number): void {
      const seq = buildSequence();
      if (seq.length === 0) return;

      const entry = getNoteAtStep(seq, stepCounter);
      if (!entry) return;

      // Apply swing: shift odd steps forward
      let adjustedTime = time;
      if (params.swing > 0 && stepIndex % 2 === 1) {
        adjustedTime += (params.swing * stepDuration) / 3;
      }

      const duration = stepDuration * params.gate;

      onNote({
        note: entry.note,
        velocity: entry.velocity,
        startTime: adjustedTime,
        duration,
      });

      stepCounter++;
    },

    getHeldNotes(): readonly number[] {
      return heldNotes.map((h) => h.note);
    },

    setParams(newParams: ArpParams): void {
      const patternChanged = newParams.pattern !== params.pattern;
      params = { ...newParams };
      if (patternChanged) {
        stepCounter = 0;
      }
    },

    reset(): void {
      stepCounter = 0;
      latchedNotes = [];
      latchSnapshot = [];
      isLatched = false;
    },
  };

  return arp;
}

/** Build the octave offset sequence for the given range and direction */
function buildOctaveSequence(
  range: number,
  direction: "up" | "down" | "up-down",
): number[] {
  if (range <= 1) return [0];

  switch (direction) {
    case "up": {
      const offsets: number[] = [];
      for (let i = 0; i < range; i++) offsets.push(i);
      return offsets;
    }
    case "down": {
      // Lowest octave first, original octave last
      const offsets: number[] = [];
      for (let i = range - 1; i >= 0; i--) offsets.push(-i);
      return offsets;
    }
    case "up-down": {
      // 0, 1, ..., range-1, range-2, ..., 1 (skip endpoints in bounce)
      const up: number[] = [];
      for (let i = 0; i < range; i++) up.push(i);
      const down: number[] = [];
      for (let i = range - 2; i > 0; i--) down.push(i);
      return [...up, ...down];
    }
  }
}

/** Build bounce indices: [0, 1, ..., n-1, n-2, ..., 1] */
function buildBounceSequence(length: number): number[] {
  if (length <= 1) return [0];
  const indices: number[] = [];
  for (let i = 0; i < length; i++) indices.push(i);
  for (let i = length - 2; i > 0; i--) indices.push(i);
  return indices;
}
