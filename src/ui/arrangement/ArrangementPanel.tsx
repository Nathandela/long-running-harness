import { useCallback, useEffect, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import {
  renderArrangement,
  type ArrangementViewState,
} from "./arrangement-renderer";
import { useArrangementInteractions } from "./use-arrangement-interactions";
import type { GridSnap } from "./hit-test";
import styles from "./ArrangementPanel.module.css";

const DEFAULT_VIEW: ArrangementViewState = {
  scrollX: 0,
  scrollY: 0,
  pixelsPerSecond: 100,
  trackHeight: 64,
  headerWidth: 160,
};

const MIN_PPS = 10;
const MAX_PPS = 500;
const ZOOM_FACTOR = 1.1;

export function ArrangementPanel(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [gridSnap] = useState<GridSnap>("1/4");
  const interactions = useArrangementInteractions(view, gridSnap);

  const tracks = useDawStore((s) => s.tracks);
  const clips = useDawStore((s) => s.clips);
  const selectedClipIds = useDawStore((s) => s.selectedClipIds);
  const cursorSeconds = useDawStore((s) => s.cursorSeconds);
  const bpm = useDawStore((s) => s.bpm);
  const transportState = useDawStore((s) => s.transportState);

  // Render loop
  const render = useCallback((): void => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    renderArrangement({
      ctx,
      width: canvas.width,
      height: canvas.height,
      view,
      tracks,
      clips,
      selectedClipIds,
      cursorSeconds,
      bpm,
    });
  }, [view, tracks, clips, selectedClipIds, cursorSeconds, bpm]);

  // Schedule re-render when state changes or during playback
  useEffect(() => {
    const tick = (): void => {
      render();
      if (transportState === "playing") {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return (): void => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [render, transportState]);

  // Handle canvas sizing with ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const parent = canvas.parentElement;
    if (parent === null) return;

    const resizeCanvas = (): void => {
      const dpr = window.devicePixelRatio;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${String(rect.width)}px`;
      canvas.style.height = `${String(rect.height)}px`;

      const ctx = canvas.getContext("2d");
      if (ctx !== null) {
        ctx.scale(dpr, dpr);
      }
    };

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(parent);
    resizeCanvas();

    return (): void => {
      observer.disconnect();
    };
  }, []);

  // Wheel: ctrl+wheel for zoom, plain wheel for scroll
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>): void => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        setView((prev) => ({
          ...prev,
          pixelsPerSecond: Math.min(
            MAX_PPS,
            Math.max(MIN_PPS, prev.pixelsPerSecond * factor),
          ),
        }));
      } else if (e.shiftKey) {
        // Horizontal scroll
        setView((prev) => ({
          ...prev,
          scrollX: Math.max(0, prev.scrollX + e.deltaY / prev.pixelsPerSecond),
        }));
      } else {
        // Vertical scroll
        setView((prev) => ({
          ...prev,
          scrollX: Math.max(0, prev.scrollX + e.deltaX / prev.pixelsPerSecond),
          scrollY: Math.max(0, prev.scrollY + e.deltaY),
        }));
      }
    },
    [],
  );

  return (
    <section data-testid="arrangement-panel" className={styles["container"]}>
      <canvas
        ref={canvasRef}
        className={styles["canvas"]}
        style={{ cursor: interactions.cursor }}
        onWheel={handleWheel}
        onMouseDown={interactions.onMouseDown}
        onMouseMove={interactions.onMouseMove}
        onMouseUp={interactions.onMouseUp}
        onDoubleClick={interactions.onDoubleClick}
      />
    </section>
  );
}
