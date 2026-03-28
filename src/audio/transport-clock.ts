/**
 * Transport state machine with cursor tracking.
 * Writes cursor position, state, and BPM to SharedArrayBuffer
 * for lock-free audio-thread <-> UI-thread communication.
 */

import { createTempoMap, type TempoMap } from "./tempo-map";
import { TransportLayout } from "./shared-buffer-layout";

export type TransportState = "stopped" | "playing" | "paused";

const STATE_STOPPED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;

export type TransportClock = {
  readonly state: TransportState;
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  setBpm(bpm: number): void;
  getCursorSeconds(): number;
  getTempoMap(): TempoMap;
  dispose(): void;
};

export function createTransportClock(
  ctx: AudioContext,
  transportSAB: SharedArrayBuffer,
  initialBpm = 120,
  sampleRate?: number,
): TransportClock {
  const rate = sampleRate ?? ctx.sampleRate;

  // SAB views -- created once (zero-allocation convention INV-3)
  const cursorView = new Float64Array(
    transportSAB,
    TransportLayout.CURSOR_SECONDS,
    1,
  );
  const stateView = new Uint8Array(transportSAB, TransportLayout.STATE, 1);
  const bpmView = new Float32Array(transportSAB, TransportLayout.BPM, 1);

  let currentState: TransportState = "stopped";
  let cursorSeconds = 0;
  let playStartContextTime = 0;
  let playStartCursorSeconds = 0;
  let tempoMap = createTempoMap(
    initialBpm,
    { numerator: 4, denominator: 4 },
    rate,
  );

  // Write initial values to SAB
  stateView[0] = STATE_STOPPED;
  bpmView[0] = initialBpm;
  cursorView[0] = 0;

  function writeSABState(state: number): void {
    stateView[0] = state;
  }

  function writeSABCursor(seconds: number): void {
    cursorView[0] = seconds;
  }

  const clock: TransportClock = {
    get state(): TransportState {
      return currentState;
    },

    play(): void {
      if (currentState === "playing") return;

      playStartContextTime = ctx.currentTime;
      playStartCursorSeconds = cursorSeconds;
      currentState = "playing";
      writeSABState(STATE_PLAYING);
    },

    pause(): void {
      if (currentState !== "playing") return;

      cursorSeconds =
        playStartCursorSeconds + (ctx.currentTime - playStartContextTime);
      currentState = "paused";
      writeSABState(STATE_PAUSED);
      writeSABCursor(cursorSeconds);
    },

    stop(): void {
      if (currentState === "stopped") return;

      cursorSeconds = 0;
      currentState = "stopped";
      writeSABState(STATE_STOPPED);
      writeSABCursor(0);
    },

    seek(seconds: number): void {
      cursorSeconds = seconds;
      if (currentState === "playing") {
        playStartContextTime = ctx.currentTime;
        playStartCursorSeconds = seconds;
      }
      writeSABCursor(seconds);
    },

    setBpm(bpm: number): void {
      const clamped = Math.min(999, Math.max(20, bpm));
      tempoMap = createTempoMap(clamped, tempoMap.timeSignature, rate);
      bpmView[0] = clamped;
    },

    getCursorSeconds(): number {
      if (currentState === "playing") {
        const elapsed = ctx.currentTime - playStartContextTime;
        const pos = playStartCursorSeconds + elapsed;
        writeSABCursor(pos);
        return pos;
      }
      return cursorSeconds;
    },

    getTempoMap(): TempoMap {
      return tempoMap;
    },

    dispose(): void {
      currentState = "stopped";
      writeSABState(STATE_STOPPED);
    },
  };

  return clock;
}
