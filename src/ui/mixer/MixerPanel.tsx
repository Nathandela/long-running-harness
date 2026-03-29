/**
 * Mixer panel with horizontal channel strips.
 * Reads track state from Zustand store.
 * Metering is driven by canvas rAF loop (NFR-13) via useMeterData hook
 * reading real AnalyserNode data from the mixer engine.
 */

import { useCallback, useState } from "react";
import { useDawStore } from "@state/store";
import { ChannelStrip } from "./ChannelStrip";
import { MasterStrip } from "./MasterStrip";
import { EffectsRack } from "@ui/effects/EffectsRack";
import { RoutingMatrix } from "./RoutingMatrix";
import { useMeterData } from "./useMeterData";
import styles from "./MixerPanel.module.css";

export function MixerPanel(): React.JSX.Element {
  const tracks = useDawStore((s) => s.tracks);
  const masterVolume = useDawStore((s) => s.masterVolume);
  const updateTrack = useDawStore((s) => s.updateTrack);
  const setMasterVolume = useDawStore((s) => s.setMasterVolume);
  const meters = useMeterData();
  const [selectedFxTrackId, setSelectedFxTrackId] = useState<string | null>(
    null,
  );
  const [showRouting, setShowRouting] = useState(false);

  const handleFxToggle = useCallback((trackId: string) => {
    setSelectedFxTrackId((prev) => (prev === trackId ? null : trackId));
  }, []);

  const handleRoutingToggle = useCallback(() => {
    setShowRouting((prev) => !prev);
  }, []);

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
    <section data-testid="mixer-panel" className={styles["mixer-wrapper"]}>
      <div className={styles["mixer-header"]}>
        <button
          className={
            showRouting
              ? (styles["btn-fx-active"] ?? "")
              : (styles["btn"] ?? "")
          }
          onClick={handleRoutingToggle}
          aria-label="Toggle routing matrix"
          aria-pressed={showRouting}
          type="button"
        >
          ROUTING
        </button>
      </div>
      <div className={styles["mixer-strips"]}>
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
              fxActive={selectedFxTrackId === track.id}
              onVolumeChange={handleVolumeChange}
              onPanChange={handlePanChange}
              onMuteToggle={handleMuteToggle}
              onSoloToggle={handleSoloToggle}
              onFxToggle={handleFxToggle}
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
      </div>
      {selectedFxTrackId !== null && (
        <EffectsRack trackId={selectedFxTrackId} />
      )}
      {showRouting && <RoutingMatrix />}
    </section>
  );
}
