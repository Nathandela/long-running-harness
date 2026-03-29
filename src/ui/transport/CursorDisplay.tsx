/**
 * BBT cursor position display.
 * Updates via requestAnimationFrame (DOM mutation, not React state)
 * to avoid triggering re-renders at 60fps.
 */

import { useEffect, useRef } from "react";
import { useTransportCursor } from "@ui/hooks/useTransportCursor";
import type { TempoMap } from "@audio/tempo-map";
import styles from "./TransportBar.module.css";

type CursorDisplayProps = {
  transportSAB: SharedArrayBuffer | null;
  tempoMap: TempoMap | null;
};

function formatBBT(bar: number, beat: number, tick: number): string {
  const b = String(bar).padStart(3, "0");
  const bt = String(beat).padStart(2, "0");
  const t = String(tick).padStart(3, "0");
  return `${b}.${bt}.${t}`;
}

export function CursorDisplay({
  transportSAB,
  tempoMap,
}: CursorDisplayProps): React.JSX.Element {
  const cursorRef = useTransportCursor(transportSAB);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (tempoMap === null) return;

    let rafId = 0;

    function update(): void {
      if (spanRef.current !== null && tempoMap !== null) {
        const bbt = tempoMap.secondsToBBT(cursorRef.current);
        spanRef.current.textContent = formatBBT(bbt.bar, bbt.beat, bbt.tick);
      }
      rafId = requestAnimationFrame(update);
    }

    rafId = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [tempoMap, cursorRef]);

  return (
    <span
      ref={spanRef}
      data-testid="cursor-display"
      aria-label="Cursor position"
      className={styles["cursorDisplay"]}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        color: "var(--color-green)",
        minWidth: "80px",
        textAlign: "center",
      }}
    >
      001.01.000
    </span>
  );
}
