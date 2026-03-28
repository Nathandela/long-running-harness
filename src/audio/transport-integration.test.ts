/**
 * Integration tests for the transport engine stack.
 * Verifies TransportClock + LookAheadScheduler + Metronome work together.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTransportClock } from "./transport-clock";
import { createLookAheadScheduler } from "./look-ahead-scheduler";
import { createMetronome } from "./metronome";
import { createSharedBuffers } from "./shared-buffer-layout";
import { TransportLayout } from "./shared-buffer-layout";

/* eslint-disable @typescript-eslint/unbound-method */

function createMockAudioContext(): AudioContext & { currentTime: number } {
  const mockGain = {
    gain: { value: 1, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
  let time = 0;
  return {
    get currentTime(): number {
      return time;
    },
    set currentTime(t: number) {
      time = t;
    },
    sampleRate: 44100,
    destination: {} as AudioDestinationNode,
    createGain: vi.fn(() => mockGain),
    createOscillator: vi.fn(() => ({
      type: "sine",
      frequency: { value: 0, setValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    })),
  } as unknown as AudioContext & { currentTime: number };
}

describe("Transport Integration", () => {
  let ctx: AudioContext & { currentTime: number };

  beforeEach(() => {
    vi.useFakeTimers();
    ctx = createMockAudioContext();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("play -> cursor advances -> stop -> cursor resets", () => {
    const sab = createSharedBuffers();
    const clock = createTransportClock(ctx, sab.transport, 120);
    const met = createMetronome(ctx);
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      undefined,
      (t, n) => {
        met.scheduleTick(t, n % 4 === 0);
      },
    );

    met.setEnabled(true);

    // Play
    ctx.currentTime = 0;
    clock.play();
    scheduler.start();
    expect(clock.state).toBe("playing");

    // Advance time
    ctx.currentTime = 1.5;
    expect(clock.getCursorSeconds()).toBeCloseTo(1.5, 6);

    // Verify scheduler fires ticks
    vi.advanceTimersByTime(50);
    expect(ctx.createOscillator).toHaveBeenCalled();

    // Stop
    met.silence();
    clock.stop();
    scheduler.stop();
    expect(clock.state).toBe("stopped");
    expect(clock.getCursorSeconds()).toBe(0);

    // Verify SAB reflects stopped state
    const stateView = new Uint8Array(sab.transport, TransportLayout.STATE, 1);
    expect(stateView[0]).toBe(0);

    clock.dispose();
    met.dispose();
  });

  it("BPM change affects beat spacing", () => {
    const sab = createSharedBuffers();
    const clock = createTransportClock(ctx, sab.transport, 120);
    const ticks: number[] = [];
    const scheduler = createLookAheadScheduler(
      ctx,
      clock,
      { intervalMs: 25, lookAheadMs: 2000 },
      (t) => {
        ticks.push(t);
      },
    );

    ctx.currentTime = 0;
    clock.play();
    scheduler.start();
    vi.advanceTimersByTime(25);
    scheduler.stop();

    // At 120 BPM, beats at 0, 0.5, 1.0, 1.5
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    if (ticks[0] !== undefined && ticks[1] !== undefined) {
      expect(ticks[1] - ticks[0]).toBeCloseTo(0.5, 3);
    }

    clock.dispose();
  });

  it("loop wraps cursor correctly", () => {
    const sab = createSharedBuffers();
    const clock = createTransportClock(ctx, sab.transport, 120);
    clock.setLoop({ enabled: true, start: 0, end: 1.0 });

    ctx.currentTime = 0;
    clock.play();

    ctx.currentTime = 1.5;
    const pos = clock.getCursorSeconds();
    expect(pos).toBeCloseTo(0.5, 6);

    clock.dispose();
  });

  it("pause preserves cursor position", () => {
    const sab = createSharedBuffers();
    const clock = createTransportClock(ctx, sab.transport, 120);

    ctx.currentTime = 0;
    clock.play();
    ctx.currentTime = 2.0;
    clock.pause();

    const pausedPos = clock.getCursorSeconds();
    expect(pausedPos).toBeCloseTo(2.0, 6);

    // Resume and verify continuation
    ctx.currentTime = 5.0;
    clock.play();
    ctx.currentTime = 6.0;
    expect(clock.getCursorSeconds()).toBeCloseTo(pausedPos + 1.0, 6);

    clock.dispose();
  });

  it("seek during playback reanchors cursor", () => {
    const sab = createSharedBuffers();
    const clock = createTransportClock(ctx, sab.transport, 120);

    ctx.currentTime = 0;
    clock.play();
    ctx.currentTime = 1.0;

    clock.seek(10.0);
    expect(clock.getCursorSeconds()).toBeCloseTo(10.0, 6);

    ctx.currentTime = 2.0;
    expect(clock.getCursorSeconds()).toBeCloseTo(11.0, 6);

    clock.dispose();
  });
});
