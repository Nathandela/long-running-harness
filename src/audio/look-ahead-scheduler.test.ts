import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLookAheadScheduler } from "./look-ahead-scheduler";
import { createTransportClock, type TransportClock } from "./transport-clock";
import { TransportLayout } from "./shared-buffer-layout";

function createMockAudioContext(
  initialTime = 0,
): AudioContext & { currentTime: number } {
  let time = initialTime;
  return {
    get currentTime(): number {
      return time;
    },
    set currentTime(t: number) {
      time = t;
    },
    sampleRate: 44100,
  } as unknown as AudioContext & { currentTime: number };
}

describe("createLookAheadScheduler", () => {
  let ctx: AudioContext & { currentTime: number };
  let sab: SharedArrayBuffer;
  let clock: TransportClock;

  beforeEach(() => {
    vi.useFakeTimers();
    ctx = createMockAudioContext();
    sab = new SharedArrayBuffer(TransportLayout.TOTAL_BYTES);
    clock = createTransportClock(ctx, sab, 120);
  });

  afterEach(() => {
    clock.dispose();
    vi.useRealTimers();
  });

  it("creates without error", () => {
    const scheduler = createLookAheadScheduler(ctx, clock);
    expect(scheduler).toBeDefined();
    expect(scheduler.isRunning).toBe(false);
    scheduler.stop();
  });

  it("fires onTick for beats in the look-ahead window", () => {
    const onTick = vi.fn();
    // 120 BPM = 0.5s per beat
    // Look-ahead 100ms (0.1s) from ctx.currentTime
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 100 },
      onTick,
    );

    ctx.currentTime = 0;
    clock.play();
    scheduler.start();

    // start() calls advance() immediately — first beat at time 0 is within [0, 0.1)
    expect(onTick).toHaveBeenCalled();

    scheduler.stop();
  });

  it("schedules beats at correct intervals for BPM", () => {
    const onTick = vi.fn();
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 600 },
      onTick,
    );

    ctx.currentTime = 0;
    clock.play();
    scheduler.start();

    // start() calls advance() immediately
    // With 600ms look-ahead, beats at t=0 and t=0.5 (120 BPM) are both in window
    expect(onTick).toHaveBeenCalledTimes(2);
    // First call: beat at 0, beat number 0
    expect(onTick.mock.calls[0]?.[0]).toBeCloseTo(0, 3);
    expect(onTick.mock.calls[0]?.[1]).toBe(0);
    // Second call: beat at 0.5
    expect(onTick.mock.calls[1]?.[0]).toBeCloseTo(0.5, 3);
    expect(onTick.mock.calls[1]?.[1]).toBe(1);

    scheduler.stop();
  });

  it("stops firing after stop()", () => {
    const onTick = vi.fn();
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 100 },
      onTick,
    );

    ctx.currentTime = 0;
    clock.play();
    scheduler.start();
    // start() calls advance() immediately, scheduling beat at t=0
    const callCount = onTick.mock.calls.length;
    expect(callCount).toBeGreaterThan(0);

    scheduler.stop();
    expect(scheduler.isRunning).toBe(false);

    ctx.currentTime = 1.0;
    vi.advanceTimersByTime(100);
    expect(onTick.mock.calls.length).toBe(callCount);
  });

  it("does not fire onTick when transport is not playing", () => {
    const onTick = vi.fn();
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 100 },
      onTick,
    );

    // Transport is stopped
    scheduler.start();
    vi.advanceTimersByTime(100);
    expect(onTick).not.toHaveBeenCalled();

    scheduler.stop();
  });

  it("tracks isRunning state", () => {
    const scheduler = createLookAheadScheduler(ctx, clock);
    expect(scheduler.isRunning).toBe(false);
    scheduler.start();
    expect(scheduler.isRunning).toBe(true);
    scheduler.stop();
    expect(scheduler.isRunning).toBe(false);
  });

  it("survives onTick throwing an error", () => {
    let callCount = 0;
    const onTick = vi.fn(() => {
      callCount++;
      if (callCount === 1) throw new Error("boom");
    });
    const onAdvance = vi.fn();

    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 600 },
      onTick,
      onAdvance,
    );

    ctx.currentTime = 0;
    clock.play();
    // Should not throw despite callback error
    expect(() => {
      scheduler.start();
    }).not.toThrow();
    // onAdvance should still have been called
    expect(onAdvance).toHaveBeenCalled();
    // onTick should have been called at least twice (beat 0 throws, beat 1 still fires)
    expect(onTick.mock.calls.length).toBeGreaterThanOrEqual(2);

    scheduler.stop();
  });

  it("survives onAdvance throwing an error", () => {
    const onTick = vi.fn();
    const onAdvance = vi.fn(() => {
      throw new Error("advance boom");
    });

    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 600 },
      onTick,
      onAdvance,
    );

    ctx.currentTime = 0;
    clock.play();
    expect(() => {
      scheduler.start();
    }).not.toThrow();
    // onTick should still fire despite onAdvance failure
    expect(onTick).toHaveBeenCalled();

    scheduler.stop();
  });
});
