import { useCallback, useEffect, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import type { AudioClipModel } from "@state/track/types";
import { AddClipCommand } from "@state/track/track-commands";
import { sharedUndoManager } from "@state/undo";
import {
  renderArrangement,
  type ArrangementViewState,
} from "./arrangement-renderer";
import { useArrangementInteractions } from "./use-arrangement-interactions";
import { xToSeconds, snapToGrid, type GridSnap } from "./hit-test";
import { RULER_HEIGHT } from "./constants";
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

type ArrangementPanelProps = {
  onOpenPianoRoll?: (clipId: string) => void;
};

export function ArrangementPanel({
  onOpenPianoRoll,
}: ArrangementPanelProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [gridSnap] = useState<GridSnap>("1/4");
  const interactions = useArrangementInteractions(
    view,
    gridSnap,
    onOpenPianoRoll,
  );
  const bpmForDrop = useDawStore((s) => s.bpm);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>): void => {
      if (!e.dataTransfer.types.includes("application/x-media-pool-source"))
        return;

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const trackIndex = Math.floor(
        (y - RULER_HEIGHT + view.scrollY) / view.trackHeight,
      );
      const state = useDawStore.getState();
      const track = trackIndex >= 0 ? state.tracks[trackIndex] : undefined;
      if (track !== undefined && track.type === "audio") {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [view],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>): void => {
      const raw = e.dataTransfer.getData("application/x-media-pool-source");
      if (!raw) return;
      e.preventDefault();

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }
      const data = parsed as Record<string, unknown>;
      if (
        typeof data.sourceId !== "string" ||
        typeof data.name !== "string" ||
        typeof data.durationSeconds !== "number"
      )
        return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const state = useDawStore.getState();
      const trackIndex = Math.floor(
        (y - RULER_HEIGHT + view.scrollY) / view.trackHeight,
      );
      if (trackIndex < 0) return;
      const track = state.tracks[trackIndex];
      if (track === undefined || track.type !== "audio") return;

      const dropTime = snapToGrid(
        Math.max(0, xToSeconds(x, view)),
        bpmForDrop,
        gridSnap,
      );

      const clip: AudioClipModel = {
        type: "audio",
        id: "clip-" + crypto.randomUUID(),
        trackId: track.id,
        sourceId: data.sourceId,
        startTime: dropTime,
        sourceOffset: 0,
        duration: data.durationSeconds,
        gain: 1,
        fadeIn: 0,
        fadeOut: 0,
        name: data.name,
      };

      const cmd = new AddClipCommand(clip);
      cmd.execute();
      sharedUndoManager.push(cmd);
    },
    [view, gridSnap, bpmForDrop],
  );

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

    const rect = canvas.getBoundingClientRect();
    renderArrangement({
      ctx,
      width: rect.width,
      height: rect.height,
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
      <span id="arrangement-keys" hidden>
        Scroll: mouse wheel. Horizontal scroll: Shift + wheel. Zoom: Ctrl/Cmd +
        wheel. Double-click to create clip. Click to select. Drag to move clips.
      </span>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="Arrangement timeline"
        aria-describedby="arrangement-keys"
        className={styles["canvas"]}
        style={{ cursor: interactions.cursor }}
        onWheel={handleWheel}
        onPointerDown={interactions.onPointerDown}
        onPointerMove={interactions.onPointerMove}
        onPointerUp={interactions.onPointerUp}
        onDoubleClick={interactions.onDoubleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    </section>
  );
}
