/**
 * Mixer panel with horizontal channel strips.
 * Reads track state from Zustand store.
 * Metering is driven by canvas rAF loop (NFR-13) via useMeterData hook
 * reading real AnalyserNode data from the mixer engine.
 */

import { useCallback } from "react";
import { useDawStore } from "@state/store";
import { ChannelStrip } from "./ChannelStrip";
import { MasterStrip } from "./MasterStrip";
import { useMeterData } from "./useMeterData";
import styles from "./MixerPanel.module.css";

export function MixerPanel(): React.JSX.Element {
  const tracks = useDawStore((s) => s.tracks);
  const masterVolume = useDawStore((s) => s.masterVolume);
  const updateTrack = useDawStore((s) => s.updateTrack);
  const setMasterVolume = useDawStore((s) => s.setMasterVolume);
  const meters = useMeterData();

  const handleVolumeChange = useCallback(
    (trackId: string, volume: number) => {
      updateTrack(trackId, { volume });
    },
    [updateTrack],
  );

  const handlePanChange = useCallback(
    (trackId: string, pan: number) => {
      updateTrack(trackId, { pan });
    },
    [updateTrack],
  );

  const handleMuteToggle = useCallback(
    (trackId: string) => {
      const track = useDawStore.getState().tracks.find((t) => t.id === trackId);
      if (track) updateTrack(trackId, { muted: !track.muted });
    },
    [updateTrack],
  );

  const handleSoloToggle = useCallback(
    (trackId: string) => {
      const track = useDawStore.getState().tracks.find((t) => t.id === trackId);
      if (track) updateTrack(trackId, { solo: !track.solo });
    },
    [updateTrack],
  );

  return (
    <section data-testid="mixer-panel" className={styles["mixer"]}>
      {tracks.length === 0 ? (
        <div className={styles["empty"]}>
          No tracks yet. Click + to add one.
        </div>
      ) : (
        tracks.map((track) => (
          <ChannelStrip
            key={track.id}
            trackId={track.id}
            name={track.name}
            color={track.color}
            volume={track.volume}
            pan={track.pan}
            muted={track.muted}
            solo={track.solo}
            meterLevel={meters.channels[track.id]?.level ?? 0}
            meterPeak={meters.channels[track.id]?.peak ?? 0}
            clipping={meters.channels[track.id]?.clipping ?? false}
            onVolumeChange={handleVolumeChange}
            onPanChange={handlePanChange}
            onMuteToggle={handleMuteToggle}
            onSoloToggle={handleSoloToggle}
          />
        ))
      )}
      <MasterStrip
        volume={masterVolume}
        meterLevel={meters.master.level}
        meterPeak={meters.master.peak}
        clipping={meters.master.clipping}
        onVolumeChange={setMasterVolume}
      />
    </section>
  );
}
