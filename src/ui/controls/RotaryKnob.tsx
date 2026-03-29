import { useRef, useEffect, useCallback } from "react";
import { tokens } from "../tokens/tokens";

type RotaryKnobProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  size?: number;
  valueText?: string;
};

const START_ANGLE = 0.75 * Math.PI;
const END_ANGLE = 2.25 * Math.PI;
const ARC_RANGE = END_ANGLE - START_ANGLE;
const DRAG_SENSITIVITY = 200;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function snapToStep(raw: number, step: number): number {
  return Math.round(raw / step) * step;
}

function drawKnob(
  ctx: CanvasRenderingContext2D,
  size: number,
  ratio: number,
): void {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - tokens.border.width * 2;

  ctx.clearRect(0, 0, size, size);

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = tokens.color.gray700;
  ctx.lineWidth = tokens.border.width;
  ctx.stroke();

  // Value arc
  const valueAngle = START_ANGLE + ratio * ARC_RANGE;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, START_ANGLE, valueAngle);
  ctx.strokeStyle = tokens.color.blue;
  ctx.lineWidth = tokens.border.width + 1;
  ctx.lineCap = "round";
  ctx.stroke();

  // Pointer line from center
  const pointerLen = radius * 0.7;
  const px = cx + Math.cos(valueAngle) * pointerLen;
  const py = cy + Math.sin(valueAngle) * pointerLen;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.strokeStyle = tokens.color.white;
  ctx.lineWidth = tokens.border.width;
  ctx.lineCap = "round";
  ctx.stroke();
}

export function RotaryKnob({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  size = 48,
  valueText,
}: RotaryKnobProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listenersRef = useRef<AbortController | null>(null);

  const ratio = max === min ? 0 : (value - min) / (max - min);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawKnob(ctx, size, ratio);
  }, [value, min, max, size, ratio]);

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return (): void => {
      listenersRef.current?.abort();
    };
  }, []);

  const commit = useCallback(
    (next: number): void => {
      onChange(clamp(snapToStep(next, step), min, max));
    },
    [onChange, min, max, step],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          e.preventDefault();
          commit(value + step);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          e.preventDefault();
          commit(value - step);
          break;
        case "PageUp":
          e.preventDefault();
          commit(value + step * 10);
          break;
        case "PageDown":
          e.preventDefault();
          commit(value - step * 10);
          break;
        case "Home":
          e.preventDefault();
          commit(min);
          break;
        case "End":
          e.preventDefault();
          commit(max);
          break;
      }
    },
    [value, step, min, max, commit],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent): void => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      if (typeof target.setPointerCapture === "function") {
        target.setPointerCapture(e.pointerId);
      }
      const startY = e.clientY;
      const startValue = value;
      const range = max - min;

      listenersRef.current?.abort();
      const controller = new AbortController();
      listenersRef.current = controller;

      document.addEventListener(
        "pointermove",
        (moveEvent: PointerEvent) => {
          const delta = startY - moveEvent.clientY;
          const fraction = delta / DRAG_SENSITIVITY;
          commit(startValue + fraction * range);
        },
        { signal: controller.signal },
      );

      document.addEventListener(
        "pointerup",
        () => {
          controller.abort();
        },
        { signal: controller.signal },
      );
    },
    [value, max, min, commit],
  );

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-label={label}
      onKeyDown={handleKeyDown}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: tokens.space[1],
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontSize: tokens.text.xs,
          fontFamily: tokens.font.mono,
          color: tokens.color.gray300,
        }}
      >
        {label}
      </span>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onPointerDown={handlePointerDown}
        style={{ cursor: "grab" }}
      />
      <span
        style={{
          fontSize: tokens.text.xs,
          fontFamily: tokens.font.mono,
          color: tokens.color.white,
        }}
      >
        {value}
      </span>
    </div>
  );
}
