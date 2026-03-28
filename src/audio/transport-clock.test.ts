import { describe, it, expect, beforeEach } from "vitest";
import { createTransportClock } from "./transport-clock";
import { TransportLayout } from "./shared-buffer-layout";

function createMockAudioContext(initialTime = 0): AudioContext {
  let time = initialTime;
  return {
    get currentTime(): number {
      return time;
    },
    set currentTime(t: number) {
      time = t;
    },
    sampleRate: 44100,
  } as unknown as AudioContext;
}

describe("createTransportClock", () => {
  let ctx: AudioContext & { currentTime: number };
  let sab: SharedArrayBuffer;

  beforeEach(() => {
    ctx = createMockAudioContext() as AudioContext & { currentTime: number };
    sab = new SharedArrayBuffer(TransportLayout.TOTAL_BYTES);
  });

  it("starts in stopped state with cursor at 0", () => {
    const clock = createTransportClock(ctx, sab);
    expect(clock.state).toBe("stopped");
    expect(clock.getCursorSeconds()).toBe(0);
    clock.dispose();
  });

  it("plays and advances cursor with context time", () => {
    const clock = createTransportClock(ctx, sab);
    ctx.currentTime = 1.0;
    clock.play();
    expect(clock.state).toBe("playing");

    ctx.currentTime = 2.0;
    expect(clock.getCursorSeconds()).toBeCloseTo(1.0, 6);

    ctx.currentTime = 3.5;
    expect(clock.getCursorSeconds()).toBeCloseTo(2.5, 6);
    clock.dispose();
  });

  it("pauses and freezes cursor", () => {
    const clock = createTransportClock(ctx, sab);
    ctx.currentTime = 1.0;
    clock.play();

    ctx.currentTime = 2.0;
    clock.pause();
    expect(clock.state).toBe("paused");
    const frozenPos = clock.getCursorSeconds();
    expect(frozenPos).toBeCloseTo(1.0, 6);

    ctx.currentTime = 5.0;
    expect(clock.getCursorSeconds()).toBeCloseTo(frozenPos, 6);
    clock.dispose();
  });

  it("stops and resets cursor to 0", () => {
    const clock = createTransportClock(ctx, sab);
    ctx.currentTime = 1.0;
    clock.play();
    ctx.currentTime = 3.0;
    clock.stop();
    expect(clock.state).toBe("stopped");
    expect(clock.getCursorSeconds()).toBe(0);
    clock.dispose();
  });

  it("resumes from paused position", () => {
    const clock = createTransportClock(ctx, sab);
    ctx.currentTime = 1.0;
    clock.play();
    ctx.currentTime = 2.0;
    clock.pause();
    const pausedAt = clock.getCursorSeconds();

    ctx.currentTime = 5.0;
    clock.play();
    ctx.currentTime = 6.0;
    expect(clock.getCursorSeconds()).toBeCloseTo(pausedAt + 1.0, 6);
    clock.dispose();
  });

  it("seek while stopped updates cursor", () => {
    const clock = createTransportClock(ctx, sab);
    clock.seek(5.0);
    expect(clock.getCursorSeconds()).toBeCloseTo(5.0, 6);
    clock.dispose();
  });

  it("seek while playing reanchors cursor", () => {
    const clock = createTransportClock(ctx, sab);
    ctx.currentTime = 1.0;
    clock.play();
    ctx.currentTime = 2.0;

    clock.seek(10.0);
    expect(clock.getCursorSeconds()).toBeCloseTo(10.0, 6);

    ctx.currentTime = 3.0;
    expect(clock.getCursorSeconds()).toBeCloseTo(11.0, 6);
    clock.dispose();
  });

  it("seek while paused updates cursor", () => {
    const clock = createTransportClock(ctx, sab);
    ctx.currentTime = 1.0;
    clock.play();
    ctx.currentTime = 2.0;
    clock.pause();
    clock.seek(8.0);
    expect(clock.getCursorSeconds()).toBeCloseTo(8.0, 6);
    clock.dispose();
  });

  it("setBpm updates internal tempo map", () => {
    const clock = createTransportClock(ctx, sab, 120);
    expect(clock.getTempoMap().bpm).toBe(120);
    clock.setBpm(140);
    expect(clock.getTempoMap().bpm).toBe(140);
    clock.dispose();
  });

  it("play while already playing is a no-op", () => {
    const clock = createTransportClock(ctx, sab);
    ctx.currentTime = 1.0;
    clock.play();
    ctx.currentTime = 2.0;
    const cursor1 = clock.getCursorSeconds();
    clock.play();
    expect(clock.getCursorSeconds()).toBeCloseTo(cursor1, 6);
    clock.dispose();
  });

  it("stop while already stopped is a no-op", () => {
    const clock = createTransportClock(ctx, sab);
    clock.stop();
    expect(clock.state).toBe("stopped");
    expect(clock.getCursorSeconds()).toBe(0);
    clock.dispose();
  });

  describe("SharedArrayBuffer sync", () => {
    it("writes state to SAB", () => {
      const clock = createTransportClock(ctx, sab);
      const stateView = new Uint8Array(sab, TransportLayout.STATE, 1);

      expect(stateView[0]).toBe(0); // stopped
      clock.play();
      expect(stateView[0]).toBe(1); // playing
      clock.pause();
      expect(stateView[0]).toBe(2); // paused
      clock.stop();
      expect(stateView[0]).toBe(0); // stopped
      clock.dispose();
    });

    it("writes BPM to SAB", () => {
      const clock = createTransportClock(ctx, sab, 120);
      const bpmView = new Float32Array(sab, TransportLayout.BPM, 1);

      expect(bpmView[0]).toBeCloseTo(120, 1);
      clock.setBpm(140);
      expect(bpmView[0]).toBeCloseTo(140, 1);
      clock.dispose();
    });

    it("writes cursor to SAB on getCursorSeconds", () => {
      const clock = createTransportClock(ctx, sab);
      ctx.currentTime = 1.0;
      clock.play();
      ctx.currentTime = 2.5;
      clock.getCursorSeconds();

      const cursorView = new Float64Array(
        sab,
        TransportLayout.CURSOR_SECONDS,
        1,
      );
      expect(cursorView[0]).toBeCloseTo(1.5, 6);
      clock.dispose();
    });
  });

  describe("tempo map", () => {
    it("returns a TempoMap with correct properties", () => {
      const clock = createTransportClock(ctx, sab, 120);
      const map = clock.getTempoMap();
      expect(map.bpm).toBe(120);
      expect(map.sampleRate).toBe(44100);
      expect(map.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      clock.dispose();
    });
  });
});
