import { useCallback, useEffect, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import { useAutomationStore } from "@state/automation";
import { isAudioClip, type AudioClipModel } from "@state/track/types";
import { AddClipCommand } from "@state/track/track-commands";
import { sharedUndoManager } from "@state/undo";
import { useMediaPool } from "@audio/media-pool/use-media-pool";
import { useAudioEngine } from "@audio/use-audio-engine";
import { useTransport } from "@audio/use-transport";
import { useTransportCursor } from "@ui/hooks/useTransportCursor";
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
  const transport = useTransport();
  const sabCursorRef = useTransportCursor(transport.getTransportSAB());

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
  const automationLanes = useAutomationStore((s) => s.lanes);
  const pool = useMediaPool();
  const engine = useAudioEngine();

  // Fetch and slice waveform peaks per audio clip
  const SAMPLES_PER_PEAK = 256;
  const [clipPeaks, setClipPeaks] = useState<
    Record<string, { peaks: Float32Array; length: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    const sampleRate = engine.ctx.sampleRate;

    async function fetchPeaks(): Promise<void> {
      const result: Record<string, { peaks: Float32Array; length: number }> =
        {};
      for (const clip of Object.values(clips)) {
        if (!isAudioClip(clip)) continue;
        const wp = await pool.getPeaks(clip.sourceId, SAMPLES_PER_PEAK);
        if (cancelled) return;
        if (!wp || wp.length === 0) continue;

        // Slice peaks to match clip's sourceOffset and duration
        const startPeak = Math.floor(
          (clip.sourceOffset * sampleRate) / wp.samplesPerPeak,
        );
        const peakCount = Math.ceil(
          (clip.duration * sampleRate) / wp.samplesPerPeak,
        );
        const endPeak = Math.min(startPeak + peakCount, wp.length);
        const sliceLen = Math.max(0, endPeak - startPeak);

        result[clip.id] = {
          peaks: wp.peaks.slice(startPeak * 2, endPeak * 2),
          length: sliceLen,
        };
      }
      if (!cancelled) setClipPeaks(result);
    }

    void fetchPeaks();
    return () => {
      cancelled = true;
    };
  }, [clips, pool, engine.ctx.sampleRate]);

  // Render the arrangement canvas
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
      automationLanes,
      clipPeaks,
    });
  }, [
    view,
    tracks,
    clips,
    selectedClipIds,
    cursorSeconds,
    bpm,
    automationLanes,
    clipPeaks,
  ]);

  // Schedule re-render when state changes or during playback.
  // During playback, read cursor from SAB (updated by audio thread) to keep
  // the playback cursor moving smoothly.
  useEffect(() => {
    if (transportState !== "playing") {
      render();
      return;
    }

    const tick = (): void => {
      const canvas = canvasRef.current;
      if (canvas !== null) {
        const ctx = canvas.getContext("2d");
        if (ctx !== null) {
          const rect = canvas.getBoundingClientRect();
          renderArrangement({
            ctx,
            width: rect.width,
            height: rect.height,
            view,
            tracks,
            clips,
            selectedClipIds,
            cursorSeconds: sabCursorRef.current,
            bpm,
            automationLanes,
            clipPeaks,
          });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return (): void => {
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- RAF loop reads SAB directly; deps trigger effect restart on state changes
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
        tabIndex={0}
        style={{ cursor: interactions.cursor }}
        onWheel={handleWheel}
        onPointerDown={interactions.onPointerDown}
        onPointerMove={interactions.onPointerMove}
        onPointerUp={interactions.onPointerUp}
        onDoubleClick={interactions.onDoubleClick}
        onKeyDown={interactions.onKeyDown}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    </section>
  );
}
