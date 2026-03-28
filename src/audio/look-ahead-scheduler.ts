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
): LookAheadScheduler {
  const intervalMs = config?.intervalMs ?? DEFAULT_CONFIG.intervalMs;
  const lookAheadSec =
    (config?.lookAheadMs ?? DEFAULT_CONFIG.lookAheadMs) / 1000;

  let timerId: ReturnType<typeof setInterval> | null = null;
  let nextBeatTime = 0;
  let currentBeat = 0;

  function advance(): void {
    if (clock.state !== "playing") return;

    const scheduleUntil = ctx.currentTime + lookAheadSec;
    const spb = clock.getTempoMap().secondsPerBeat();

    while (nextBeatTime < scheduleUntil) {
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

      // Anchor the first beat to the current context time
      nextBeatTime = ctx.currentTime;
      currentBeat = 0;

      timerId = setInterval(advance, intervalMs);
    },

    stop(): void {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      nextBeatTime = 0;
      currentBeat = 0;
    },
  };

  return scheduler;
}
