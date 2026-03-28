/**
 * Look-ahead scheduler using the Chris Wilson pattern:
 * setInterval fires every ~25ms, scheduling audio events
 * that fall within the next 100ms of AudioContext time.
 *
 * This runs on the main thread. The setInterval callback is lightweight
 * (just math + scheduling calls), so it doesn't block rendering.
 */

import type { TransportClock } from "./transport-clock";

export type SchedulerConfig = {
  intervalMs: number;
  lookAheadMs: number;
};

export type LookAheadScheduler = {
  start(): void;
  stop(): void;
  /** Re-sync beat phase to the current clock position (e.g. after seek). */
  sync(): void;
  readonly isRunning: boolean;
};

const DEFAULT_CONFIG: SchedulerConfig = {
  intervalMs: 25,
  lookAheadMs: 100,
};

export function createLookAheadScheduler(
  ctx: AudioContext,
  clock: TransportClock,
  config?: Partial<SchedulerConfig>,
  onTick?: (beatTime: number, beatNumber: number) => void,
  onAdvance?: (
    windowStart: number,
    windowEnd: number,
    timeOffset: number,
  ) => void,
): LookAheadScheduler {
  const intervalMs = config?.intervalMs ?? DEFAULT_CONFIG.intervalMs;
  const lookAheadSec =
    (config?.lookAheadMs ?? DEFAULT_CONFIG.lookAheadMs) / 1000;

  let timerId: ReturnType<typeof setInterval> | null = null;
  let nextBeatTime = 0;
  let currentBeat = 0;

  function syncToPosition(cursorSec: number): void {
    const spb = clock.getTempoMap().secondsPerBeat();
    const totalBeats = cursorSec / spb;
    const wholeBeat = Math.floor(totalBeats + 1e-9);
    const remainder = totalBeats - wholeBeat;

    if (remainder < 1e-6) {
      // On a beat boundary — schedule this beat now
      currentBeat = wholeBeat;
      nextBeatTime = ctx.currentTime;
    } else {
      // Between beats — schedule next beat
      currentBeat = wholeBeat + 1;
      nextBeatTime = ctx.currentTime + (currentBeat * spb - cursorSec);
    }
  }

  function advance(): void {
    if (clock.state !== "playing") return;

    // Drive SAB cursor updates and detect loop wraps
    clock.updateCursor();

    if (clock.didLoopWrap()) {
      syncToPosition(clock.getCursorSeconds());
    }

    const scheduleUntil = ctx.currentTime + lookAheadSec;
    const spb = clock.getTempoMap().secondsPerBeat();

    // Constrain scheduling window to the loop end boundary
    const loop = clock.getLoop();
    let effectiveUntil = scheduleUntil;
    if (loop.enabled && loop.end > loop.start) {
      const cursorNow = clock.getCursorSeconds();
      const timeToLoopEnd = loop.end - cursorNow;
      if (timeToLoopEnd > 0) {
        effectiveUntil = Math.min(
          scheduleUntil,
          ctx.currentTime + timeToLoopEnd,
        );
      }
    }

    // Fire window-level callback for continuous schedulers (automation, clips)
    const timeOffset = ctx.currentTime - clock.getCursorSeconds();
    onAdvance?.(ctx.currentTime, effectiveUntil, timeOffset);

    while (nextBeatTime < effectiveUntil) {
      onTick?.(nextBeatTime, currentBeat);
      currentBeat++;
      nextBeatTime += spb;
    }
  }

  const scheduler: LookAheadScheduler = {
    get isRunning(): boolean {
      return timerId !== null;
    },

    start(): void {
      if (timerId !== null) return;

      // Phase-correct: sync beat position to current cursor
      syncToPosition(clock.getCursorSeconds());

      timerId = setInterval(advance, intervalMs);
      advance();
    },

    stop(): void {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      nextBeatTime = 0;
      currentBeat = 0;
    },

    sync(): void {
      syncToPosition(clock.getCursorSeconds());
    },
  };

  return scheduler;
}
