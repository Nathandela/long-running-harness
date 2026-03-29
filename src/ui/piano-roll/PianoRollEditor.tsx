import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import { isMidiClip } from "@state/track/types";
import { CommandRegistry } from "@ui/keyboard/command-registry";
import { ShortcutMap } from "@ui/keyboard/shortcut-map";
import { useKeyboardShortcuts } from "@ui/keyboard/useKeyboardShortcuts";
import {
  renderPianoRoll,
  type PianoRollViewState,
  type PianoRollTool,
} from "./piano-roll-renderer";
import type { PianoRollGridSnap } from "./piano-roll-hit-test";
import { usePianoRollInteractions } from "./use-piano-roll-interactions";
import {
  PR_DEFAULT_NOTE_HEIGHT,
  PR_KEYBOARD_WIDTH,
  PR_DEFAULT_PPS,
  PR_DEFAULT_SCROLL_Y,
  PR_VELOCITY_LANE_HEIGHT,
  PR_MIN_NOTE,
  PR_MAX_NOTE,
} from "./constants";
import styles from "./PianoRollEditor.module.css";

const DEFAULT_VIEW: PianoRollViewState = {
  scrollX: 0,
  scrollY: PR_DEFAULT_SCROLL_Y,
  pixelsPerSecond: PR_DEFAULT_PPS,
  noteHeight: PR_DEFAULT_NOTE_HEIGHT,
  keyboardWidth: PR_KEYBOARD_WIDTH,
};

const MIN_PPS = 20;
const MAX_PPS = 500;
const ZOOM_FACTOR = 1.1;

const SNAP_OPTIONS: readonly PianoRollGridSnap[] = [
  "1/4",
  "1/8",
  "1/16",
  "1/8T",
  "1/16T",
];

type PianoRollEditorProps = {
  clipId: string | null;
  onNotePreview?: (note: number, velocity: number) => void;
  onNotePreviewEnd?: (note: number) => void;
};

export function PianoRollEditor({
  clipId,
  onNotePreview: _onNotePreview,
  onNotePreviewEnd: _onNotePreviewEnd,
}: PianoRollEditorProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [tool, setTool] = useState<PianoRollTool>("pencil");
  const [gridSnap, setGridSnap] = useState<PianoRollGridSnap>("1/8");
  const [view, setView] = useState(DEFAULT_VIEW);

  const interactions = usePianoRollInteractions(clipId, view, tool, gridSnap);

  // Store selectors
  const clips = useDawStore((s) => s.clips);
  const selectedNoteIds = useDawStore((s) => s.selectedNoteIds);
  const cursorSeconds = useDawStore((s) => s.cursorSeconds);
  const bpm = useDawStore((s) => s.bpm);
  const transportState = useDawStore((s) => s.transportState);

  // Derive clip data
  const clip = clipId !== null ? clips[clipId] : undefined;
  const notes = useMemo(
    () => (clip !== undefined && isMidiClip(clip) ? clip.noteEvents : []),
    [clip],
  );
  const clipStartTime = clip !== undefined ? clip.startTime : 0;
  const clipDuration = clip !== undefined ? clip.duration : 4;

  // Keyboard commands
  const { deleteSelectedNotes } = interactions;
  const registry = useMemo(() => {
    const reg = new CommandRegistry();
    reg.register({
      id: "piano-roll.tool.pencil",
      label: "Pencil Tool",
      execute() {
        setTool("pencil");
      },
    });
    reg.register({
      id: "piano-roll.tool.select",
      label: "Select Tool",
      execute() {
        setTool("select");
      },
    });
    reg.register({
      id: "piano-roll.tool.erase",
      label: "Erase Tool",
      execute() {
        setTool("erase");
      },
    });
    reg.register({
      id: "piano-roll.delete-selected",
      label: "Delete Selected Notes",
      execute() {
        deleteSelectedNotes();
      },
    });
    return reg;
  }, [deleteSelectedNotes]);

  const shortcuts = useMemo(() => {
    const map = new ShortcutMap();
    map.bind({ key: "p", commandId: "piano-roll.tool.pencil" });
    map.bind({ key: "s", commandId: "piano-roll.tool.select" });
    map.bind({ key: "e", commandId: "piano-roll.tool.erase" });
    map.bind({ key: "Delete", commandId: "piano-roll.delete-selected" });
    map.bind({ key: "Backspace", commandId: "piano-roll.delete-selected" });
    return map;
  }, []);

  useKeyboardShortcuts(registry, shortcuts);

  // Render loop
  const render = useCallback((): void => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    const rect = canvas.getBoundingClientRect();
    renderPianoRoll({
      ctx,
      width: rect.width,
      height: rect.height,
      view,
      notes,
      selectedNoteIds: [...selectedNoteIds],
      cursorSeconds,
      bpm,
      clipStartTime,
      clipDuration,
      tool,
      velocityLaneHeight: PR_VELOCITY_LANE_HEIGHT,
    });
  }, [
    view,
    notes,
    selectedNoteIds,
    cursorSeconds,
    bpm,
    clipStartTime,
    clipDuration,
    tool,
  ]);

  // RAF scheduling
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

  // Canvas sizing with ResizeObserver
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
      render();
    };

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(parent);
    resizeCanvas();

    return (): void => {
      observer.disconnect();
    };
  }, [render]);

  // Wheel: ctrl+wheel for zoom, plain wheel for scroll
  // Attached via useEffect with { passive: false } so preventDefault() works
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        setView((prev) => ({
          ...prev,
          pixelsPerSecond: Math.min(
            MAX_PPS,
            Math.max(MIN_PPS, prev.pixelsPerSecond * factor),
          ),
        }));
      } else if (e.shiftKey) {
        setView((prev) => ({
          ...prev,
          scrollX: Math.max(0, prev.scrollX + e.deltaY / prev.pixelsPerSecond),
        }));
      } else {
        setView((prev) => ({
          ...prev,
          scrollX: Math.max(0, prev.scrollX + e.deltaX / prev.pixelsPerSecond),
          scrollY: Math.min(
            PR_MAX_NOTE,
            Math.max(PR_MIN_NOTE, prev.scrollY - e.deltaY / prev.noteHeight),
          ),
        }));
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return (): void => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <section data-testid="piano-roll-editor" className={styles["container"]}>
      <div className={styles["toolbar"]}>
        <button
          data-testid="tool-pencil"
          className={styles["toolButton"]}
          aria-pressed={tool === "pencil"}
          title="Pencil Tool (P)"
          onClick={() => {
            setTool("pencil");
          }}
        >
          Pencil
        </button>
        <button
          data-testid="tool-select"
          className={styles["toolButton"]}
          aria-pressed={tool === "select"}
          title="Select Tool (S)"
          onClick={() => {
            setTool("select");
          }}
        >
          Select
        </button>
        <button
          data-testid="tool-erase"
          className={styles["toolButton"]}
          aria-pressed={tool === "erase"}
          title="Erase Tool (E)"
          onClick={() => {
            setTool("erase");
          }}
        >
          Erase
        </button>
        <select
          data-testid="snap-select"
          className={styles["snapSelect"]}
          value={gridSnap}
          onChange={(e) => {
            setGridSnap(e.target.value as PianoRollGridSnap);
          }}
        >
          {SNAP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className={styles["canvasWrapper"]}>
        <canvas
          ref={canvasRef}
          role="application"
          tabIndex={0}
          aria-label="Piano roll editor"
          className={styles["canvas"]}
          style={{ cursor: interactions.cursor }}
          onPointerDown={interactions.onPointerDown}
          onPointerMove={interactions.onPointerMove}
          onPointerUp={interactions.onPointerUp}
        />
      </div>
    </section>
  );
}
