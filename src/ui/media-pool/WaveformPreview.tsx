import { useRef, useEffect } from "react";
import type { WaveformPeaks } from "@audio/media-pool";

type WaveformPreviewProps = {
  peaks: WaveformPeaks;
  width?: number;
  height?: number;
};

export function WaveformPreview({
  peaks,
  width = 120,
  height = 24,
}: WaveformPreviewProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    ctx.clearRect(0, 0, width, height);

    const numPeaks = peaks.length;
    if (numPeaks === 0) return;

    const mid = height / 2;
    const barWidth = width / numPeaks;

    ctx.fillStyle =
      getComputedStyle(canvas).getPropertyValue("--color-blue").trim() ||
      "#0066ff";

    for (let i = 0; i < numPeaks; i++) {
      const min = peaks.peaks[i * 2] ?? 0;
      const max = peaks.peaks[i * 2 + 1] ?? 0;
      const x = i * barWidth;
      const top = mid - max * mid;
      const bottom = mid - min * mid;
      ctx.fillRect(x, top, Math.max(barWidth - 0.5, 0.5), bottom - top);
    }
  }, [peaks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      role="img"
      aria-label="Waveform"
      style={{ display: "block", width, height }}
    />
  );
}
