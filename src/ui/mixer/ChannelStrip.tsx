/**
 * Individual channel strip for the mixer panel.
 * Fader, pan knob, mute/solo buttons, VU meter, track name.
 */

import { useCallback } from "react";
import { Fader } from "@ui/controls/Fader";
import { RotaryKnob } from "@ui/controls/RotaryKnob";
import { VuMeter } from "@ui/controls/VuMeter";
import { volumeToDb } from "./format";
import styles from "./MixerPanel.module.css";

type ChannelStripProps = {
  trackId: string;
  name: string;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  meterLevel: number;
  meterPeak: number;
  clipping: boolean;
  fxActive: boolean;
  onVolumeChange: (trackId: string, volume: number) => void;
  onPanChange: (trackId: string, pan: number) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
  onFxToggle: (trackId: string) => void;
};

export function ChannelStrip({
  trackId,
  name,
  color,
  volume,
  pan,
  muted,
  solo,
  meterLevel,
  meterPeak,
  clipping,
  fxActive,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onFxToggle,
}: ChannelStripProps): React.JSX.Element {
  const handleVolume = useCallback(
    (v: number) => {
      onVolumeChange(trackId, v / 100);
    },
    [trackId, onVolumeChange],
  );
  const handlePan = useCallback(
    (v: number) => {
      onPanChange(trackId, v / 100);
    },
    [trackId, onPanChange],
  );
  const handleMute = useCallback(() => {
    onMuteToggle(trackId);
  }, [trackId, onMuteToggle]);
  const handleSolo = useCallback(() => {
    onSoloToggle(trackId);
  }, [trackId, onSoloToggle]);
  const handleFx = useCallback(() => {
    onFxToggle(trackId);
  }, [trackId, onFxToggle]);

  const stripClass = [styles["strip"], muted ? styles["strip-muted"] : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={stripClass} data-testid={`channel-strip-${trackId}`}>
      <div
        style={{
          width: "100%",
          height: 3,
          backgroundColor: color,
        }}
      />
      <div className={styles["name"]}>{name}</div>

      <RotaryKnob
        value={Math.round(pan * 100)}
        min={-100}
        max={100}
        step={1}
        onChange={handlePan}
        label="PAN"
        size={32}
      />

      <div className={styles["meter-fader-row"]}>
        <VuMeter
          level={meterLevel}
          peak={meterPeak}
          clip={clipping}
          width={8}
          height={96}
        />
        <Fader
          value={Math.round(volume * 100)}
          min={0}
          max={200}
          step={1}
          onChange={handleVolume}
          label=""
          height={96}
        />
      </div>

      <div className={styles["db-label"]}>{volumeToDb(volume)}</div>

      <div className={styles["controls-row"]}>
        <button
          className={
            muted ? (styles["btn-mute-active"] ?? "") : (styles["btn"] ?? "")
          }
          onClick={handleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          type="button"
        >
          M
        </button>
        <button
          className={
            solo ? (styles["btn-solo-active"] ?? "") : (styles["btn"] ?? "")
          }
          onClick={handleSolo}
          aria-label={solo ? "Unsolo" : "Solo"}
          aria-pressed={solo}
          type="button"
        >
          S
        </button>
      </div>
      <button
        className={
          fxActive ? (styles["btn-fx-active"] ?? "") : (styles["btn"] ?? "")
        }
        onClick={handleFx}
        aria-label={`Toggle effects for ${name}`}
        aria-pressed={fxActive}
        type="button"
      >
        FX
      </button>
    </div>
  );
}
