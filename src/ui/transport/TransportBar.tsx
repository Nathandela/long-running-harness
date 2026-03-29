import { useCallback, useState } from "react";
import { useTransport } from "@audio/use-transport";
import { useDawStore } from "@state/index";
import { BpmInput } from "./BpmInput";
import { CursorDisplay } from "./CursorDisplay";
import styles from "./TransportBar.module.css";

export function TransportBar(): React.JSX.Element {
  const transport = useTransport();
  const transportState = useDawStore((s) => s.transportState);
  const bpm = useDawStore((s) => s.bpm);
  const loopEnabled = useDawStore((s) => s.loopEnabled);
  const setLoop = useDawStore((s) => s.setLoop);
  const [metronomeOn, setMetronomeOn] = useState(false);

  const handleLoopToggle = useCallback((): void => {
    setLoop(!loopEnabled);
  }, [loopEnabled, setLoop]);

  const handleMetronomeToggle = useCallback((): void => {
    const next = !metronomeOn;
    setMetronomeOn(next);
    transport.setMetronomeEnabled(next);
  }, [metronomeOn, transport]);

  const handleBpmChange = useCallback(
    (newBpm: number): void => {
      transport.setBpm(newBpm);
    },
    [transport],
  );

  const isPlaying = transportState === "playing";
  const clock = transport.getClock();
  const tempoMap = clock?.getTempoMap() ?? null;

  return (
    <header data-testid="toolbar" className={styles["transportBar"]}>
      <span className={styles["brand"]}>BRUTALWAV</span>
      <div className={styles["spacer"]} />

      <div className={styles["controls"]}>
        <span className={styles["label"]}>BPM</span>
        <BpmInput value={bpm} onChange={handleBpmChange} />

        <span className={styles["label"]}>4/4</span>

        <button
          type="button"
          className={styles["transportBtn"]}
          aria-pressed={isPlaying}
          aria-label="Play"
          onClick={() => {
            transport.play();
          }}
        >
          {"\u25B6"}
        </button>

        <button
          type="button"
          className={styles["transportBtn"]}
          aria-label="Stop"
          onClick={() => {
            transport.stop();
          }}
        >
          {"\u25A0"}
        </button>

        <CursorDisplay
          transportSAB={transport.getTransportSAB()}
          tempoMap={tempoMap}
        />

        <button
          type="button"
          role="switch"
          aria-checked={loopEnabled}
          aria-label="Loop"
          className={styles["transportBtn"]}
          data-active={loopEnabled}
          onClick={handleLoopToggle}
        >
          LOOP
        </button>

        <div className={styles["metronomeToggle"]}>
          <button
            type="button"
            role="switch"
            aria-checked={metronomeOn}
            aria-label="Metronome"
            className={styles["transportBtn"]}
            data-active={metronomeOn}
            onClick={handleMetronomeToggle}
          >
            MET
          </button>
        </div>
      </div>
    </header>
  );
}
