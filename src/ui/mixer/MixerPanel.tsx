/**
 * Mixer panel with horizontal channel strips.
 * Reads track state from Zustand store.
 * Metering is driven by canvas rAF loop (NFR-13) -- currently static
 * until the audio engine is wired to real AnalyserNode data.
 */

import { useCallback } from "react";
import { useDawStore } from "@state/store";
import { ChannelStrip } from "./ChannelStrip";
import { MasterStrip } from "./MasterStrip";
import styles from "./MixerPanel.module.css";

export function MixerPanel(): React.JSX.Element {
  const tracks = useDawStore((s) => s.tracks);
  const masterVolume = useDawStore((s) => s.masterVolume);
  const updateTrack = useDawStore((s) => s.updateTrack);
  const setMasterVolume = useDawStore((s) => s.setMasterVolume);

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
      const track = tracks.find((t) => t.id === trackId);
      if (track) updateTrack(trackId, { muted: !track.muted });
    },
    [tracks, updateTrack],
  );

  const handleSoloToggle = useCallback(
    (trackId: string) => {
      const track = tracks.find((t) => t.id === trackId);
      if (track) updateTrack(trackId, { solo: !track.solo });
    },
    [tracks, updateTrack],
  );

  return (
    <section data-testid="mixer-panel" className={styles["mixer"]}>
      {tracks.map((track) => (
        <ChannelStrip
          key={track.id}
          trackId={track.id}
          name={track.name}
          color={track.color}
          volume={track.volume}
          pan={track.pan}
          muted={track.muted}
          solo={track.solo}
          meterLevel={0}
          meterPeak={0}
          clipping={false}
          onVolumeChange={handleVolumeChange}
          onPanChange={handlePanChange}
          onMuteToggle={handleMuteToggle}
          onSoloToggle={handleSoloToggle}
        />
      ))}
      <MasterStrip
        volume={masterVolume}
        meterLevel={0}
        meterPeak={0}
        clipping={false}
        onVolumeChange={setMasterVolume}
      />
    </section>
  );
}
