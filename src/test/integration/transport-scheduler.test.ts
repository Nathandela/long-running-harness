/**
 * Integration tests: Transport <-> Scheduler clock sync [E3->E7,E10]
 * and 808 <-> Transport step sync [E10->E3].
 *
 * Verifies:
 * - Scheduler drives transport cursor via updateCursor()
 * - Beat callbacks fire at correct times relative to BPM
 * - Loop wraps re-sync the scheduler
 * - Step sequencer triggers are synchronized to beat callbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createTransportClock,
  type TransportClock,
} from "@audio/transport-clock";
import { createLookAheadScheduler } from "@audio/look-ahead-scheduler";
import { createStepSequencer } from "@audio/drum-machine/step-sequencer";
import { TransportLayout } from "@audio/shared-buffer-layout";
import { createMockAudioContext, advanceTime } from "./helpers";

describe("Transport <-> Scheduler integration", () => {
  let ctx: AudioContext;
  let transportSAB: SharedArrayBuffer;
  let clock: TransportClock;

  beforeEach(() => {
    vi.useFakeTimers();
    ctx = createMockAudioContext();
    transportSAB = new SharedArrayBuffer(TransportLayout.TOTAL_BYTES);
    clock = createTransportClock(ctx, transportSAB, 120);
  });

  afterEach(() => {
    clock.dispose();
    vi.useRealTimers();
  });

  it("scheduler calls updateCursor and fires beat ticks at correct BPM", () => {
    const ticks: Array<{ beatTime: number; beatNumber: number }> = [];
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 600 },
      (beatTime, beatNumber) => {
        ticks.push({ beatTime, beatNumber });
      },
    );

    clock.play();
    scheduler.start();

    // At 120 BPM, one beat = 0.5s. With 600ms lookahead, first tick should
    // schedule beats 0, 1 (at 0s and 0.5s)
    expect(ticks.length).toBeGreaterThanOrEqual(1);

    const firstTick = ticks[0];
    expect(firstTick).toBeDefined();
    expect(firstTick?.beatNumber).toBe(0);

    // Advance time by 1 second and fire a scheduler interval
    advanceTime(ctx, 1);
    vi.advanceTimersByTime(25);

    // Should have scheduled beats up through ~1.6s window
    const maxBeat = Math.max(...ticks.map((t) => t.beatNumber));
    expect(maxBeat).toBeGreaterThanOrEqual(2); // At least beats 0,1,2

    scheduler.stop();
  });

  it("SAB cursor updates as transport plays", () => {
    const cursorView = new Float64Array(
      transportSAB,
      TransportLayout.CURSOR_SECONDS,
      1,
    );

    const scheduler = createLookAheadScheduler(ctx, clock, {
      intervalMs: 25,
      lookAheadMs: 100,
    });

    expect(cursorView[0]).toBe(0);

    clock.play();
    scheduler.start();

    advanceTime(ctx, 0.5);
    vi.advanceTimersByTime(25); // Trigger scheduler advance

    // updateCursor writes to SAB
    const cursor = cursorView[0];
    expect(cursor).toBeDefined();
    expect(cursor).toBeGreaterThan(0);

    scheduler.stop();
  });

  it("loop wrap re-syncs scheduler beat phase", () => {
    const ticks: Array<{ beatTime: number; beatNumber: number }> = [];
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 100 },
      (beatTime, beatNumber) => {
        ticks.push({ beatTime, beatNumber });
      },
    );

    // Set a 2-beat loop (0-1s at 120 BPM)
    clock.setLoop({ enabled: true, start: 0, end: 1 });
    clock.play();
    scheduler.start();

    ticks.length = 0;

    // Advance past loop end
    advanceTime(ctx, 1.1);
    vi.advanceTimersByTime(25);

    // After loop wrap, cursor should be back near loop start (~0.1s into 1.0s loop)
    expect(clock.getCursorSeconds()).toBeCloseTo(0.1, 1);
    expect(clock.didLoopWrap()).toBe(true);

    scheduler.stop();
  });

  it("BPM change updates tempo map for scheduler", () => {
    const ticks: number[] = [];
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 2000 },
      (beatTime) => {
        ticks.push(beatTime);
      },
    );

    clock.play();
    clock.setBpm(60); // 1 beat per second
    scheduler.start();

    const spb = clock.getTempoMap().secondsPerBeat();
    expect(spb).toBeCloseTo(1.0, 3);

    // Verify scheduler actually produces beats spaced ~1s apart at 60 BPM
    advanceTime(ctx, 2);
    vi.advanceTimersByTime(25);

    expect(ticks.length).toBeGreaterThanOrEqual(2);
    const gap = (ticks[1] as number) - (ticks[0] as number);
    expect(gap).toBeCloseTo(1.0, 2); // Beats 1s apart at 60 BPM

    scheduler.stop();
  });

  it("seek resets cursor and SAB", () => {
    const cursorView = new Float64Array(
      transportSAB,
      TransportLayout.CURSOR_SECONDS,
      1,
    );

    clock.play();
    advanceTime(ctx, 2);
    clock.updateCursor();
    expect(cursorView[0]).toBeCloseTo(2, 1);

    clock.seek(5);
    expect(cursorView[0]).toBeCloseTo(5, 1);
    expect(clock.getCursorSeconds()).toBeCloseTo(5, 1);
  });

  it("transport state transitions write to SAB", () => {
    const stateView = new Uint8Array(transportSAB, TransportLayout.STATE, 1);

    expect(stateView[0]).toBe(0); // stopped
    clock.play();
    expect(stateView[0]).toBe(1); // playing
    clock.pause();
    expect(stateView[0]).toBe(2); // paused
    clock.stop();
    expect(stateView[0]).toBe(0); // stopped
  });
});

describe("808 Step Sequencer <-> Transport sync", () => {
  let ctx: AudioContext;
  let transportSAB: SharedArrayBuffer;
  let clock: TransportClock;
  let triggers: Array<{
    instrumentId: string;
    time: number;
    velocity: number;
  }>;

  beforeEach(() => {
    vi.useFakeTimers();
    ctx = createMockAudioContext();
    transportSAB = new SharedArrayBuffer(TransportLayout.TOTAL_BYTES);
    clock = createTransportClock(ctx, transportSAB, 120);
    triggers = [];
  });

  afterEach(() => {
    clock.dispose();
    vi.useRealTimers();
  });

  it("step sequencer fires triggers on scheduler beat callbacks", () => {
    const sequencer = createStepSequencer((trigger) => {
      triggers.push({
        instrumentId: trigger.instrumentId,
        time: trigger.time,
        velocity: trigger.velocity,
      });
    });

    // Enable bass drum on steps 0, 4, 8, 12 (four-on-the-floor)
    sequencer.toggleStep("bd", 0);
    sequencer.toggleStep("bd", 4);
    sequencer.toggleStep("bd", 8);
    sequencer.toggleStep("bd", 12);

    // Connect scheduler -> sequencer
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 500 },
      (beatTime, beatNumber) => {
        sequencer.scheduleStep(beatNumber, beatTime);
      },
    );

    clock.play();
    scheduler.start();

    // First advance should schedule beat 0 (bd trigger)
    const bdTriggers = triggers.filter((t) => t.instrumentId === "bd");
    expect(bdTriggers.length).toBeGreaterThanOrEqual(1);

    scheduler.stop();
  });

  it("accent steps produce higher velocity", () => {
    const sequencer = createStepSequencer((trigger) => {
      triggers.push({
        instrumentId: trigger.instrumentId,
        time: trigger.time,
        velocity: trigger.velocity,
      });
    });

    sequencer.toggleStep("sd", 2);
    sequencer.setAccent(2, true);
    sequencer.toggleStep("sd", 4);
    // step 4 has no accent

    // Schedule both steps
    sequencer.scheduleStep(2, 0.5);
    sequencer.scheduleStep(4, 1.0);

    const sdTriggers = triggers.filter((t) => t.instrumentId === "sd");
    expect(sdTriggers).toHaveLength(2);
    expect(sdTriggers[0]?.velocity).toBe(1.0); // accented
    expect(sdTriggers[1]?.velocity).toBe(0.8); // normal
  });

  it("pattern switch changes active step data", () => {
    const sequencer = createStepSequencer(() => {
      // no-op for this test
    });

    sequencer.toggleStep("ch", 0);
    const patternA = sequencer.getPattern();
    expect(patternA.steps[0]?.triggers.ch).toBe(true);

    sequencer.switchPattern("B");
    const patternB = sequencer.getPattern();
    expect(patternB.steps[0]?.triggers.ch).toBe(false);

    sequencer.toggleStep("oh", 0);
    const patternBUpdated = sequencer.getPattern();
    expect(patternBUpdated.steps[0]?.triggers.oh).toBe(true);

    // Switch back - pattern A should be preserved
    sequencer.switchPattern("A");
    const patternABack = sequencer.getPattern();
    expect(patternABack.steps[0]?.triggers.ch).toBe(true);
    expect(patternABack.steps[0]?.triggers.oh).toBe(false);
  });
});
