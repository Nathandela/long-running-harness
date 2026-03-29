import { useCallback, useRef, useState } from "react";
import { useAutomationStore } from "@state/automation";
import type { ParameterTarget } from "@audio/automation/automation-types";

type AutomationLaneEditorProps = {
  trackId: string;
  viewStartSec: number;
  viewEndSec: number;
  trackHeight: number;
};

const DEFAULT_TARGET: ParameterTarget = { type: "mixer", param: "volume" };
const EMPTY_LANES: readonly never[] = [];

export function AutomationLaneEditor({
  trackId,
  viewStartSec,
  viewEndSec,
  trackHeight,
}: AutomationLaneEditorProps): React.JSX.Element {
  const lanes = useAutomationStore((s) => s.lanes[trackId]) ?? EMPTY_LANES;
  const addLane = useAutomationStore((s) => s.addLane);
  const removeLane = useAutomationStore((s) => s.removeLane);
  const addPoint = useAutomationStore((s) => s.addPoint);
  const movePoint = useAutomationStore((s) => s.movePoint);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const didDragRef = useRef(false);

  const volumeLane = lanes.find(
    (l) => l.target.type === "mixer" && l.target.param === "volume",
  );

  const handleToggle = useCallback((): void => {
    if (volumeLane) {
      removeLane(trackId, volumeLane.id);
    } else {
      addLane(trackId, DEFAULT_TARGET);
    }
  }, [trackId, volumeLane, addLane, removeLane]);

  const posToTime = useCallback(
    (clientX: number): number => {
      const el = canvasRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const frac = (clientX - rect.left) / rect.width;
      return viewStartSec + frac * (viewEndSec - viewStartSec);
    },
    [viewStartSec, viewEndSec],
  );

  const posToValue = useCallback((clientY: number): number => {
    const el = canvasRef.current;
    if (!el) return 0.5;
    const rect = el.getBoundingClientRect();
    // Top = 1.0, bottom = 0.0
    return Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      if (!volumeLane) return;
      const time = posToTime(e.clientX);
      const value = posToValue(e.clientY);
      addPoint(trackId, volumeLane.id, {
        id: `pt-${crypto.randomUUID()}`,
        time,
        value,
        interpolation: "linear",
        curve: 0,
      });
    },
    [trackId, volumeLane, addPoint, posToTime, posToValue],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (!volumeLane) return;

      // Check if clicking near an existing point (hit test)
      const time = posToTime(e.clientX);
      const value = posToValue(e.clientY);
      const hit = volumeLane.points.find((pt) => {
        const timeDist = Math.abs(pt.time - time);
        const valDist = Math.abs(pt.value - value);
        const timeTolerance = (viewEndSec - viewStartSec) * 0.02;
        return timeDist < timeTolerance && valDist < 0.05;
      });

      if (hit) {
        e.preventDefault();
        didDragRef.current = true;
        setDraggingPointId(hit.id);
        const el = e.target as HTMLElement;
        if (typeof el.setPointerCapture === "function") {
          el.setPointerCapture(e.pointerId);
        }
      }
    },
    [volumeLane, posToTime, posToValue, viewStartSec, viewEndSec],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      if (draggingPointId === null || !volumeLane) return;
      didDragRef.current = true;
      const time = posToTime(e.clientX);
      const value = posToValue(e.clientY);
      movePoint(trackId, volumeLane.id, draggingPointId, time, value);
    },
    [trackId, volumeLane, draggingPointId, movePoint, posToTime, posToValue],
  );

  const handlePointerUp = useCallback((): void => {
    setDraggingPointId(null);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Toggle Automation"
        aria-pressed={!!volumeLane}
        onClick={handleToggle}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 1,
          fontSize: 10,
          padding: "2px 4px",
          background: volumeLane ? "#00ccff" : "#333",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        A
      </button>
      {volumeLane && (
        <div
          ref={canvasRef}
          data-testid="automation-lane-canvas"
          style={{
            width: "100%",
            height: trackHeight,
            cursor: draggingPointId !== null ? "grabbing" : "crosshair",
          }}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </div>
  );
}
