/**
 * E13: Routing matrix UI.
 * Visual overview of all track outputs, sends, bus assignments, and sidechains.
 */

import { useDawStore } from "@state/store";
import { useRoutingStore } from "@state/routing/routing-store";
import styles from "./RoutingMatrix.module.css";

function SendCell({
  trackId,
  busId,
  level,
  preFader,
}: {
  trackId: string;
  busId: string;
  level: number;
  preFader: boolean;
}): React.JSX.Element {
  const updateSendLevel = useRoutingStore((s) => s.updateSendLevel);
  const togglePreFader = useRoutingStore((s) => s.togglePreFader);

  return (
    <td
      className={styles["send-cell-active"]}
      data-testid={`send-cell-${trackId}-${busId}`}
    >
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(level * 100)}
        onChange={(e) => {
          updateSendLevel(trackId, busId, Number(e.target.value) / 100);
        }}
        className={styles["send-slider"]}
        aria-label={`Send level ${trackId} to ${busId}`}
      />
      <button
        className={preFader ? styles["pre-active"] : styles["pre"]}
        onClick={() => {
          togglePreFader(trackId, busId);
        }}
        type="button"
        aria-label={preFader ? "Switch to post-fader" : "Switch to pre-fader"}
      >
        {preFader ? "PRE" : "POST"}
      </button>
    </td>
  );
}

function EmptyCell({
  trackId,
  busId,
}: {
  trackId: string;
  busId: string;
}): React.JSX.Element {
  const addSend = useRoutingStore((s) => s.addSend);

  return (
    <td
      className={styles["send-cell"]}
      data-testid={`send-cell-${trackId}-${busId}`}
    >
      <button
        className={styles["add-send"]}
        onClick={() => {
          addSend(trackId, { busId, level: 0.5, preFader: false });
        }}
        type="button"
        aria-label={`Add send from ${trackId} to ${busId}`}
      >
        +
      </button>
    </td>
  );
}

export function RoutingMatrix(): React.JSX.Element {
  const tracks = useDawStore((s) => s.tracks);
  const buses = useRoutingStore((s) => s.buses);
  const sends = useRoutingStore((s) => s.sends);
  const sidechains = useRoutingStore((s) => s.sidechains);

  const busIds = Object.keys(buses);

  return (
    <section data-testid="routing-matrix" className={styles["matrix"]}>
      {busIds.length === 0 ? (
        <div className={styles["empty"]}>No buses configured</div>
      ) : (
        <table className={styles["table"]}>
          <thead>
            <tr>
              <th className={styles["header"]}>Track</th>
              {busIds.map((busId) => {
                const bus = buses[busId];
                if (!bus) return null;
                return (
                  <th key={busId} className={styles["header"]}>
                    <div>{bus.name}</div>
                    <div className={styles["bus-target"]}>
                      -&gt; {bus.outputTarget}
                    </div>
                  </th>
                );
              })}
              <th className={styles["header"]}>SC</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track) => {
              const trackSends = sends[track.id] ?? [];
              const trackSidechains = sidechains.filter(
                (sc) => sc.sourceId === track.id || sc.targetId === track.id,
              );

              return (
                <tr key={track.id}>
                  <td className={styles["track-name"]}>{track.name}</td>
                  {busIds.map((busId) => {
                    const send = trackSends.find((s) => s.busId === busId);
                    if (send) {
                      return (
                        <SendCell
                          key={busId}
                          trackId={track.id}
                          busId={busId}
                          level={send.level}
                          preFader={send.preFader}
                        />
                      );
                    }
                    return (
                      <EmptyCell key={busId} trackId={track.id} busId={busId} />
                    );
                  })}
                  <td className={styles["sc-cell"]}>
                    {trackSidechains.map((sc) => (
                      <span
                        key={`${sc.sourceId}-${sc.targetId}`}
                        data-testid={`sidechain-${sc.sourceId}-${sc.targetId}`}
                        className={styles["sc-badge"]}
                      >
                        {sc.sourceId === track.id
                          ? `-> ${sc.targetId}`
                          : `<- ${sc.sourceId}`}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
