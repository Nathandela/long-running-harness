import { useDawStore } from "@state/store";
import { SynthEditor } from "@ui/synth";
import styles from "./panels.module.css";

export function InstrumentPanel(): React.JSX.Element {
  const selectedTrackIds = useDawStore((s) => s.selectedTrackIds);
  const tracks = useDawStore((s) => s.tracks);
  const selectedTrack = tracks.find((t) => selectedTrackIds.includes(t.id));

  if (selectedTrack?.type === "instrument") {
    return (
      <section
        data-testid="instrument-panel"
        className={styles["instrumentPanelFull"]}
      >
        <SynthEditor trackId={selectedTrack.id} />
      </section>
    );
  }

  return (
    <section
      data-testid="instrument-panel"
      className={styles["instrumentPanel"]}
    >
      {selectedTrack ? "AUDIO TRACK" : "INSTRUMENT"}
    </section>
  );
}
