import { useRef, useEffect, useCallback } from "react";
import { tokens } from "../tokens/tokens";
import { useReducedMotion } from "../hooks/useReducedMotion";

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
const CLIP_PULSE_SPEED = 4; // cycles per second

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
  const reducedMotion = useReducedMotion();

  const level = Math.min(1, Math.max(0, rawLevel));

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, time = 0): void => {
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

      // Peak hold line with ease-out decay
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

      // Clip indicator with pulse animation
      if (clip === true) {
        const pulse = reducedMotion
          ? 1
          : 0.5 + 0.5 * Math.sin(time * CLIP_PULSE_SPEED * 2 * Math.PI);
        const size = CLIP_INDICATOR_SIZE + (reducedMotion ? 0 : pulse * 2);
        ctx.globalAlpha = 0.4 + 0.6 * pulse;
        ctx.fillStyle = tokens.color.red;
        ctx.fillRect((w - size) / 2, 1, size, size);
        ctx.globalAlpha = 1;
      }
    },
    [level, clip, width, height, reducedMotion],
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

    // Animate when peak is decaying or clip is pulsing
    const needsAnimation =
      (peak === undefined && peakHoldRef.current > 0) ||
      (clip === true && !reducedMotion);

    if (needsAnimation && !animatingRef.current) {
      animatingRef.current = true;
      const startTime = performance.now();
      const animate = (): void => {
        const elapsed = (performance.now() - startTime) / 1000;

        // Ease-out peak decay: rate slows as peak approaches 0
        if (peak === undefined && peakHoldRef.current > 0) {
          const decayRate = PEAK_DECAY_RATE * (0.3 + 0.7 * peakHoldRef.current);
          peakHoldRef.current = Math.max(0, peakHoldRef.current - decayRate);
        }

        draw(ctx, elapsed);

        const stillDecaying = peak === undefined && peakHoldRef.current > 0;
        const stillClipping = clip === true && !reducedMotion;

        if (stillDecaying || stillClipping) {
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
  }, [level, peak, clip, draw, reducedMotion]);

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
