/**
 * Hook that reads AnalyserNode data via rAF and provides live
 * peak/RMS/clip meter values for all mixer channels and master.
 *
 * NFR-13: Bypasses React reconciliation — reads directly from
 * Web Audio AnalyserNodes at display refresh rate.
 */

import { useEffect, useRef, useState } from "react";
import { useEffectsBridgeContext } from "@audio/effects/EffectsBridgeProvider";
import {
  createAnalyserReader,
  MeterState,
  updateMeterState,
} from "@audio/mixer/metering";

export type ChannelMeterData = {
  readonly level: number;
  readonly peak: number;
  readonly clipping: boolean;
};

export type MeterSnapshot = {
  readonly channels: Readonly<Record<string, ChannelMeterData>>;
  readonly master: ChannelMeterData;
};

const EMPTY_MASTER: ChannelMeterData = { level: 0, peak: 0, clipping: false };
const EMPTY: MeterSnapshot = { channels: {}, master: EMPTY_MASTER };

/**
 * Read live meter data from the mixer engine's AnalyserNodes.
 * Updates at rAF rate (~60fps). Returns a snapshot of all channel
 * and master meter values.
 */
export function useMeterData(): MeterSnapshot {
  const { mixer } = useEffectsBridgeContext();
  const [snapshot, setSnapshot] = useState(EMPTY);
  const mixerRef = useRef(mixer);

  useEffect(() => {
    mixerRef.current = mixer;
  }, [mixer]);

  useEffect(() => {
    const readers = new Map<string, ReturnType<typeof createAnalyserReader>>();
    const states = new Map<string, MeterState>();
    let masterReader: ReturnType<typeof createAnalyserReader> | null = null;
    const masterState = new MeterState();
    let lastTime = 0;
    let raf = 0;

    function tick(time: number): void {
      const deltaMs = lastTime > 0 ? time - lastTime : 16;
      lastTime = time;

      const m = mixerRef.current;
      const strips = m.getAllStrips();
      const channels: Record<string, ChannelMeterData> = {};

      for (const strip of strips) {
        if (!readers.has(strip.trackId)) {
          readers.set(strip.trackId, createAnalyserReader(strip.analyser));
          states.set(strip.trackId, new MeterState());
        }

        const reader = readers.get(strip.trackId);
        const state = states.get(strip.trackId);
        if (!reader || !state) continue;

        const { peak, rms } = reader.read();
        updateMeterState(state, peak, rms, deltaMs);

        channels[strip.trackId] = {
          level: state.rms,
          peak: state.peak,
          clipping: state.clipping,
        };
      }

      // Clean up readers for removed strips
      for (const id of readers.keys()) {
        if (!strips.some((s) => s.trackId === id)) {
          readers.delete(id);
          states.delete(id);
        }
      }

      // Master metering
      if (masterReader === null) {
        masterReader = createAnalyserReader(m.getMaster().analyser);
      }
      const masterData = masterReader.read();
      updateMeterState(masterState, masterData.peak, masterData.rms, deltaMs);

      setSnapshot({
        channels,
        master: {
          level: masterState.rms,
          peak: masterState.peak,
          clipping: masterState.clipping,
        },
      });

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return snapshot;
}
