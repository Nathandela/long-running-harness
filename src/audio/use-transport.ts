/**
 * Controller hook that bridges the transport audio layer to the Zustand store.
 * Creates and manages TransportClock, LookAheadScheduler, and Metronome.
 */

import { useCallback, useEffect, useRef } from "react";
import { useAudioEngine } from "./use-audio-engine";
import { createTransportClock, type TransportClock } from "./transport-clock";
import {
  createLookAheadScheduler,
  type LookAheadScheduler,
} from "./look-ahead-scheduler";
import { createMetronome, type Metronome } from "./metronome";
import {
  createSharedBuffers,
  type SharedArrayBufferLayout,
} from "./shared-buffer-layout";
import { useDawStore } from "@state/index";

export type UseTransportReturn = {
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  setBpm(bpm: number): void;
  setMetronomeEnabled(on: boolean): void;
  getTransportSAB(): SharedArrayBuffer | null;
  getClock(): TransportClock | null;
};

export function useTransport(): UseTransportReturn {
  const engine = useAudioEngine();
  const clockRef = useRef<TransportClock | null>(null);
  const schedulerRef = useRef<LookAheadScheduler | null>(null);
  const metronomeRef = useRef<Metronome | null>(null);
  const sabRef = useRef<SharedArrayBufferLayout | null>(null);

  const storePlay = useDawStore((s) => s.play);
  const storePause = useDawStore((s) => s.pause);
  const storeStop = useDawStore((s) => s.stop);
  const storeSetBpm = useDawStore((s) => s.setBpm);
  const storeSetCursor = useDawStore((s) => s.setCursor);
  const bpm = useDawStore((s) => s.bpm);

  // Initialize on mount
  useEffect(() => {
    const sab = createSharedBuffers();
    sabRef.current = sab;

    const clock = createTransportClock(engine.ctx, sab.transport, bpm);
    clockRef.current = clock;

    const met = createMetronome(engine.ctx);
    metronomeRef.current = met;

    const beatsPerBar = clock.getTempoMap().timeSignature.numerator;
    const scheduler = createLookAheadScheduler(
      engine.ctx,
      clock,
      undefined,
      (beatTime: number, beatNumber: number) => {
        const isDownbeat = beatNumber % beatsPerBar === 0;
        met.scheduleTick(beatTime, isDownbeat);
      },
    );
    schedulerRef.current = scheduler;

    return () => {
      scheduler.stop();
      met.dispose();
      clock.dispose();
      clockRef.current = null;
      schedulerRef.current = null;
      metronomeRef.current = null;
      sabRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, [engine]);

  const play = useCallback((): void => {
    const clock = clockRef.current;
    const scheduler = schedulerRef.current;
    if (clock === null || scheduler === null) return;
    if (clock.state === "playing") return;

    clock.play();
    scheduler.start();
    storePlay();
  }, [storePlay]);

  const pause = useCallback((): void => {
    const clock = clockRef.current;
    const scheduler = schedulerRef.current;
    if (clock === null || scheduler === null) return;
    if (clock.state !== "playing") return;

    clock.pause();
    scheduler.stop();
    storeSetCursor(clock.getCursorSeconds());
    storePause();
  }, [storePause, storeSetCursor]);

  const stop = useCallback((): void => {
    const clock = clockRef.current;
    const scheduler = schedulerRef.current;
    const met = metronomeRef.current;
    if (clock === null || scheduler === null) return;

    // INV-6: Guarantee silence within 10ms
    met?.silence();
    clock.stop();
    scheduler.stop();
    storeSetCursor(0);
    storeStop();
  }, [storeStop, storeSetCursor]);

  const seek = useCallback(
    (seconds: number): void => {
      const clock = clockRef.current;
      if (clock === null) return;

      clock.seek(seconds);
      storeSetCursor(seconds);
    },
    [storeSetCursor],
  );

  const setBpm = useCallback(
    (newBpm: number): void => {
      const clock = clockRef.current;
      if (clock === null) return;

      clock.setBpm(newBpm);
      storeSetBpm(newBpm);
    },
    [storeSetBpm],
  );

  const setMetronomeEnabled = useCallback((on: boolean): void => {
    metronomeRef.current?.setEnabled(on);
  }, []);

  const getTransportSAB = useCallback((): SharedArrayBuffer | null => {
    return sabRef.current?.transport ?? null;
  }, []);

  const getClock = useCallback((): TransportClock | null => {
    return clockRef.current;
  }, []);

  return {
    play,
    pause,
    stop,
    seek,
    setBpm,
    setMetronomeEnabled,
    getTransportSAB,
    getClock,
  };
}
