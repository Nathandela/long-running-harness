import { useRef, useEffect, useCallback } from "react";
import { tokens } from "../tokens/tokens";

type VuMeterProps = {
  level: number;
  peak?: number;
  clip?: boolean;
  width?: number;
  height?: number;
};

const DEFAULT_WIDTH = 12;
const DEFAULT_HEIGHT = 128;
const PEAK_DECAY_RATE = 0.005;
const CLIP_INDICATOR_SIZE = 4;

function getLevelColor(normalizedY: number): string {
  if (normalizedY > 0.9) return tokens.color.red;
  if (normalizedY > 0.7) return tokens.color.amber;
  return tokens.color.green;
}

function buildAriaLabel(level: number, clip: boolean): string {
  const pct = Math.round(level * 100);
  return clip
    ? `Audio level: ${String(pct)}% (clipping)`
    : `Audio level: ${String(pct)}%`;
}

export function VuMeter({
  level: rawLevel,
  peak,
  clip,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: VuMeterProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peakHoldRef = useRef(peak ?? 0);
  const rafRef = useRef(0);
  const animatingRef = useRef(false);

  const level = Math.min(1, Math.max(0, rawLevel));

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D): void => {
      const w = width;
      const h = height;

      // Background
      ctx.fillStyle = tokens.color.black;
      ctx.fillRect(0, 0, w, h);

      // Level bar (drawn from bottom up)
      const barHeight = level * h;
      const barTop = h - barHeight;

      for (let y = barTop; y < h; y++) {
        const normalizedY = 1 - y / h;
        ctx.fillStyle = getLevelColor(normalizedY);
        ctx.fillRect(0, y, w, 1);
      }

      // Peak hold line
      const currentPeak = peakHoldRef.current;
      if (currentPeak > 0) {
        const peakY = h - currentPeak * h;
        ctx.strokeStyle = tokens.color.white;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, peakY);
        ctx.lineTo(w, peakY);
        ctx.stroke();
      }

      // Clip indicator
      if (clip === true) {
        ctx.fillStyle = tokens.color.red;
        ctx.fillRect(
          (w - CLIP_INDICATOR_SIZE) / 2,
          1,
          CLIP_INDICATOR_SIZE,
          CLIP_INDICATOR_SIZE,
        );
      }
    },
    [level, clip, width, height],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    // Update peak hold from prop or current level
    if (peak !== undefined) {
      peakHoldRef.current = peak;
    } else if (level > peakHoldRef.current) {
      peakHoldRef.current = level;
    }

    draw(ctx);

    // Animate peak decay
    if (
      peak === undefined &&
      peakHoldRef.current > 0 &&
      !animatingRef.current
    ) {
      animatingRef.current = true;
      const animate = (): void => {
        if (peakHoldRef.current > 0) {
          peakHoldRef.current = Math.max(
            0,
            peakHoldRef.current - PEAK_DECAY_RATE,
          );
          draw(ctx);
          rafRef.current = requestAnimationFrame(animate);
        } else {
          animatingRef.current = false;
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }

    return (): void => {
      cancelAnimationFrame(rafRef.current);
      animatingRef.current = false;
    };
  }, [level, peak, clip, draw]);

  const isClipping = clip === true;

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={buildAriaLabel(level, isClipping)}
      width={width}
      height={height}
    />
  );
}
