import { useCallback, useRef, useEffect } from "react";
import styles from "./Fader.module.css";

type FaderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  height?: number;
  valueText?: string;
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function Fader({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  height = 128,
  valueText,
}: FaderProps): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const listenersRef = useRef<AbortController | null>(null);

  const fraction = max === min ? 0 : (value - min) / (max - min);

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return (): void => {
      listenersRef.current?.abort();
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      let next: number | undefined;

      switch (e.key) {
        case "ArrowUp":
          next = clamp(value + step, min, max);
          break;
        case "ArrowDown":
          next = clamp(value - step, min, max);
          break;
        case "PageUp":
          next = clamp(value + step * 10, min, max);
          break;
        case "PageDown":
          next = clamp(value - step * 10, min, max);
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }

      e.preventDefault();
      onChange(next);
    },
    [value, min, max, step, onChange],
  );

  const valueFromY = useCallback(
    (clientY: number): number => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const pxFromBottom = rect.bottom - clientY;
      const ratio = pxFromBottom / rect.height;
      const raw = min + ratio * (max - min);
      return clamp(Math.round(raw / step) * step, min, max);
    },
    [value, min, max, step],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent): void => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      if (typeof target.setPointerCapture === "function") {
        target.setPointerCapture(e.pointerId);
      }

      listenersRef.current?.abort();
      const controller = new AbortController();
      listenersRef.current = controller;

      document.addEventListener(
        "pointermove",
        (ev: PointerEvent) => {
          onChange(valueFromY(ev.clientY));
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
    [onChange, valueFromY],
  );

  return (
    <div
      className={styles["container"]}
      role="slider"
      tabIndex={0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-orientation="vertical"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={trackRef}
        className={styles["track"]}
        style={{ height: `${String(height)}px` }}
      >
        <div
          className={styles["active"]}
          style={{ height: `${String(fraction * 100)}%` }}
        />
        <div
          className={styles["thumb"]}
          style={{ bottom: `${String(fraction * 100)}%` }}
          onPointerDown={handlePointerDown}
        />
      </div>
      <span className={styles["label"]}>{label}</span>
    </div>
  );
}
