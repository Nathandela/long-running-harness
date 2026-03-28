/**
 * Master bus channel strip.
 * Fader, VU meter, dB display.
 */

import { useCallback } from "react";
import { Fader } from "@ui/controls/Fader";
import { VuMeter } from "@ui/controls/VuMeter";
import styles from "./MixerPanel.module.css";

type MasterStripProps = {
  volume: number;
  meterLevel: number;
  meterPeak: number;
  clipping: boolean;
  onVolumeChange: (volume: number) => void;
};

function volumeToDb(v: number): string {
  if (v <= 0) return "-inf";
  const db = 20 * Math.log10(v);
  return db >= 0 ? `+${db.toFixed(1)}` : db.toFixed(1);
}

export function MasterStrip({
  volume,
  meterLevel,
  meterPeak,
  clipping,
  onVolumeChange,
}: MasterStripProps): React.JSX.Element {
  const handleVolume = useCallback(
    (v: number) => {
      onVolumeChange(v / 100);
    },
    [onVolumeChange],
  );

  return (
    <div className={styles["strip-master"]} data-testid="master-strip">
      <div
        style={{
          width: "100%",
          height: 3,
          backgroundColor: "var(--color-white)",
        }}
      />
      <div className={styles["name"]}>MASTER</div>

      <div className={styles["meter-fader-row"]}>
        <VuMeter
          level={meterLevel}
          peak={meterPeak}
          clip={clipping}
          width={10}
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
    </div>
  );
}
