import { describe, it, expect, beforeEach } from "vitest";
import { createArpeggiator } from "./arpeggiator";
import type { ArpNoteEvent, ArpParams } from "./arpeggiator-types";
import { DEFAULT_ARP_PARAMS } from "./arpeggiator-types";

describe("createArpeggiator", () => {
  let events: ArpNoteEvent[];
  let onNote: (e: ArpNoteEvent) => void;

  beforeEach(() => {
    events = [];
    onNote = (e): void => {
      events.push(e);
    };
  });

  function makeArp(
    overrides?: Partial<ArpParams>,
  ): ReturnType<typeof createArpeggiator> {
    return createArpeggiator(onNote, {
      ...DEFAULT_ARP_PARAMS,
      enabled: true,
      ...overrides,
    });
  }

  // ─── Basic note management ───

  it("creates an arpeggiator with empty held notes", () => {
    const arp = makeArp();
    expect(arp.getHeldNotes()).toEqual([]);
  });

  it("noteOn adds to held notes", () => {
    const arp = makeArp();
    arp.noteOn(60, 100);
    expect(arp.getHeldNotes()).toEqual([60]);
  });

  it("noteOff removes from held notes", () => {
    const arp = makeArp();
    arp.noteOn(60, 100);
    arp.noteOn(64, 90);
    arp.noteOff(60);
    expect(arp.getHeldNotes()).toEqual([64]);
  });

  it("duplicate noteOn does not add twice", () => {
    const arp = makeArp();
    arp.noteOn(60, 100);
    arp.noteOn(60, 80);
    expect(arp.getHeldNotes()).toEqual([60]);
  });

  it("allNotesOff clears held notes", () => {
    const arp = makeArp();
    arp.noteOn(60, 100);
    arp.noteOn(64, 90);
    arp.allNotesOff();
    expect(arp.getHeldNotes()).toEqual([]);
  });

  // ─── Pattern: up ───

  it("pattern up: plays notes in ascending order", () => {
    const arp = makeArp({ pattern: "up" });
    arp.noteOn(64, 100); // E4
    arp.noteOn(60, 100); // C4
    arp.noteOn(67, 100); // G4

    // Schedule 3 steps at bpm=120, 1/8 notes = 0.25s per step
    arp.scheduleStep(0, 0.0, 0.25);
    arp.scheduleStep(1, 0.25, 0.25);
    arp.scheduleStep(2, 0.5, 0.25);

    expect(events).toHaveLength(3);
    expect(events[0]?.note).toBe(60); // C4 (lowest)
    expect(events[1]?.note).toBe(64); // E4
    expect(events[2]?.note).toBe(67); // G4
  });

  // ─── Pattern: down ───

  it("pattern down: plays notes in descending order", () => {
    const arp = makeArp({ pattern: "down" });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);
    arp.noteOn(67, 100);

    arp.scheduleStep(0, 0.0, 0.25);
    arp.scheduleStep(1, 0.25, 0.25);
    arp.scheduleStep(2, 0.5, 0.25);

    expect(events[0]?.note).toBe(67);
    expect(events[1]?.note).toBe(64);
    expect(events[2]?.note).toBe(60);
  });

  // ─── Pattern: up-down ───

  it("pattern up-down: ascending then descending without repeating ends", () => {
    const arp = makeArp({ pattern: "up-down" });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);
    arp.noteOn(67, 100);

    // C E G E (up-down without repeating top/bottom)
    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events[0]?.note).toBe(60); // C
    expect(events[1]?.note).toBe(64); // E
    expect(events[2]?.note).toBe(67); // G
    expect(events[3]?.note).toBe(64); // E (descending, skip top)
  });

  // ─── Pattern: down-up ───

  it("pattern down-up: descending then ascending without repeating ends", () => {
    const arp = makeArp({ pattern: "down-up" });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);
    arp.noteOn(67, 100);

    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events[0]?.note).toBe(67); // G
    expect(events[1]?.note).toBe(64); // E
    expect(events[2]?.note).toBe(60); // C
    expect(events[3]?.note).toBe(64); // E (ascending, skip bottom)
  });

  // ─── Pattern: as-played ───

  it("pattern as-played: plays in insertion order", () => {
    const arp = makeArp({ pattern: "as-played" });
    arp.noteOn(67, 100); // G first
    arp.noteOn(60, 100); // C second
    arp.noteOn(64, 100); // E third

    for (let i = 0; i < 3; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events[0]?.note).toBe(67);
    expect(events[1]?.note).toBe(60);
    expect(events[2]?.note).toBe(64);
  });

  // ─── Pattern: random ───

  it("pattern random: produces notes from held set", () => {
    const arp = makeArp({ pattern: "random" });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);
    arp.noteOn(67, 100);

    for (let i = 0; i < 10; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events).toHaveLength(10);
    const noteSet = new Set(events.map((e) => e.note));
    // All notes should be from the held set
    for (const n of noteSet) {
      expect([60, 64, 67]).toContain(n);
    }
  });

  // ─── Gate control ───

  it("gate controls note duration as fraction of step", () => {
    const arp = makeArp({ gate: 0.5 });
    arp.noteOn(60, 100);
    arp.scheduleStep(0, 0.0, 0.25); // step duration = 0.25s

    expect(events[0]?.duration).toBeCloseTo(0.125); // 50% of 0.25
  });

  it("gate 1.0 means full step duration", () => {
    const arp = makeArp({ gate: 1.0 });
    arp.noteOn(60, 100);
    arp.scheduleStep(0, 0.0, 0.5);

    expect(events[0]?.duration).toBeCloseTo(0.5);
  });

  // ─── Velocity ───

  it("preserves input velocity", () => {
    const arp = makeArp();
    arp.noteOn(60, 77);
    arp.scheduleStep(0, 0.0, 0.25);

    expect(events[0]?.velocity).toBe(77);
  });

  // ─── Octave range ───

  it("octaveRange 2 with direction up adds notes one octave higher", () => {
    const arp = makeArp({
      octaveRange: 2,
      octaveDirection: "up",
      pattern: "up",
    });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);

    // With 2 octaves: C4 E4 C5 E5
    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events).toHaveLength(4);
    expect(events[0]?.note).toBe(60); // C4
    expect(events[1]?.note).toBe(64); // E4
    expect(events[2]?.note).toBe(72); // C5
    expect(events[3]?.note).toBe(76); // E5
  });

  it("octaveRange 2 with direction down adds notes one octave lower", () => {
    const arp = makeArp({
      octaveRange: 2,
      octaveDirection: "down",
      pattern: "up",
    });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);

    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events).toHaveLength(4);
    expect(events[0]?.note).toBe(48); // C3
    expect(events[1]?.note).toBe(52); // E3
    expect(events[2]?.note).toBe(60); // C4
    expect(events[3]?.note).toBe(64); // E4
  });

  it("octave up-down plays up then down octaves", () => {
    const arp = makeArp({
      octaveRange: 3,
      octaveDirection: "up-down",
      pattern: "up",
    });
    arp.noteOn(60, 100);

    // 3 octaves up-down: C4 C5 C6 C5 (skip endpoints in bounce)
    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events[0]?.note).toBe(60); // Oct 0
    expect(events[1]?.note).toBe(72); // Oct 1
    expect(events[2]?.note).toBe(84); // Oct 2
    expect(events[3]?.note).toBe(72); // Oct 1 (bouncing back)
  });

  it("clips notes at MIDI 127", () => {
    const arp = makeArp({
      octaveRange: 4,
      octaveDirection: "up",
      pattern: "up",
    });
    arp.noteOn(120, 100);

    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    // All output notes should be <= 127
    for (const e of events) {
      expect(e.note).toBeLessThanOrEqual(127);
    }
  });

  // ─── Swing ───

  it("swing shifts odd-indexed steps forward", () => {
    const arp = makeArp({ swing: 0.5 });
    arp.noteOn(60, 100);

    // Step 0: on time, Step 1: shifted forward
    arp.scheduleStep(0, 0.0, 0.25);
    arp.scheduleStep(1, 0.25, 0.25);

    expect(events[0]?.startTime).toBe(0.0);
    // Swing of 0.5 shifts odd steps by (0.5 * 0.25) / 3 = 0.04167
    expect(events[1]?.startTime).toBeCloseTo(0.25 + (0.5 * 0.25) / 3);
  });

  // ─── Latch mode (R-STA-07) ───

  it("latch off: stops producing events after all notes released", () => {
    const arp = makeArp({ latch: false });
    arp.noteOn(60, 100);
    arp.noteOff(60);

    arp.scheduleStep(0, 0.0, 0.25);
    expect(events).toHaveLength(0);
  });

  it("latch on: continues arpeggio with all held notes after keys released", () => {
    const arp = makeArp({ latch: true, pattern: "up" });
    arp.noteOn(60, 80);
    arp.noteOn(64, 90);
    arp.noteOff(60);
    arp.noteOff(64);

    // Both notes should be in the latched pool with original velocities
    arp.scheduleStep(0, 0.0, 0.25);
    arp.scheduleStep(1, 0.25, 0.25);
    expect(events).toHaveLength(2);
    expect(events[0]?.note).toBe(60);
    expect(events[0]?.velocity).toBe(80);
    expect(events[1]?.note).toBe(64);
    expect(events[1]?.velocity).toBe(90);
  });

  it("latch: new noteOn after all released clears latched notes", () => {
    const arp = makeArp({ latch: true, pattern: "up" });
    arp.noteOn(60, 100);
    arp.noteOff(60);

    // Now play a new note - should replace the latched pool
    arp.noteOn(72, 90);

    arp.scheduleStep(0, 0.0, 0.25);
    expect(events[0]?.note).toBe(72);
  });

  // ─── No held notes ───

  it("produces no events when no notes are held", () => {
    const arp = makeArp();
    arp.scheduleStep(0, 0.0, 0.25);
    expect(events).toHaveLength(0);
  });

  // ─── Single note ───

  it("single held note repeats", () => {
    const arp = makeArp({ pattern: "up" });
    arp.noteOn(60, 100);

    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events).toHaveLength(4);
    expect(events.every((e) => e.note === 60)).toBe(true);
  });

  // ─── Wrapping / cycling ───

  it("pattern wraps around after completing a cycle", () => {
    const arp = makeArp({ pattern: "up" });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);

    // 4 steps = 2 complete cycles
    for (let i = 0; i < 4; i++) {
      arp.scheduleStep(i, i * 0.25, 0.25);
    }

    expect(events[0]?.note).toBe(60);
    expect(events[1]?.note).toBe(64);
    expect(events[2]?.note).toBe(60); // wraps
    expect(events[3]?.note).toBe(64);
  });

  // ─── setParams ───

  it("setParams updates arpeggiator behavior", () => {
    const arp = makeArp({ pattern: "up" });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);

    arp.scheduleStep(0, 0.0, 0.25);
    expect(events[0]?.note).toBe(60); // up starts at lowest

    arp.setParams({ ...DEFAULT_ARP_PARAMS, enabled: true, pattern: "down" });
    events.length = 0;

    arp.scheduleStep(0, 0.25, 0.25);
    expect(events[0]?.note).toBe(64); // down starts at highest
  });

  // ─── reset ───

  it("reset clears state and step counter", () => {
    const arp = makeArp({ pattern: "up" });
    arp.noteOn(60, 100);
    arp.noteOn(64, 100);

    arp.scheduleStep(0, 0.0, 0.25);
    arp.scheduleStep(1, 0.25, 0.25);

    arp.reset();
    events.length = 0;

    arp.scheduleStep(0, 0.5, 0.25);
    expect(events[0]?.note).toBe(60); // restarted from beginning
  });
});
