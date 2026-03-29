/**
 * Pure canvas renderer for the arrangement view.
 * No DOM access -- only draws to the CanvasRenderingContext2D passed in.
 */
import { isAudioClip, isMidiClip } from "@state/track/types";
import type { TrackModel, ClipModel } from "@state/track/types";
import type { AutomationLane } from "@audio/automation/automation-types";
import { evaluateCurve } from "@audio/automation/automation-curve";
import {
  RULER_HEIGHT,
  CLIP_PADDING,
  DELETE_BTN_SIZE,
  DELETE_BTN_MARGIN,
} from "./constants";

// -- Design token constants (canvas cannot read CSS vars) ---------------------

const COLOR = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  pink: "#ff2d6f",
  blue: "#0066ff",
  gray900: "#111111",
  gray700: "#333333",
  gray500: "#666666",
} as const;

const FONT_MONO = "'JetBrains Mono', monospace" as const;
const TEXT_XS = 10;
const TEXT_SM = 12;
const BORDER_WIDTH = 2;
const COLOR_STRIP_WIDTH = 4;

// -- Public types -------------------------------------------------------------

export type ArrangementViewState = {
  scrollX: number;
  scrollY: number;
  pixelsPerSecond: number;
  trackHeight: number;
  headerWidth: number;
};

export type RenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  view: ArrangementViewState;
  tracks: readonly TrackModel[];
  clips: Record<string, ClipModel>;
  selectedClipIds: readonly string[];
  cursorSeconds: number;
  bpm: number;
  automationLanes?: Record<string, readonly AutomationLane[]>;
  clipPeaks?: Record<string, { peaks: Float32Array; length: number }>;
  loopEnabled?: boolean;
  loopStart?: number;
  loopEnd?: number;
};

// -- Helpers ------------------------------------------------------------------

function secondsToX(seconds: number, view: ArrangementViewState): number {
  return view.headerWidth + (seconds - view.scrollX) * view.pixelsPerSecond;
}

function trackY(index: number, view: ArrangementViewState): number {
  return RULER_HEIGHT + index * view.trackHeight - view.scrollY;
}

/** Convert a hex color (#rrggbb) to rgba with given alpha (0-1). */
function hexToRgba(hex: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(128,128,128,${String(alpha)})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${String(r)},${String(g)},${String(b)},${String(alpha)})`;
}

// -- Rendering stages ---------------------------------------------------------

function drawBackground(rc: RenderContext): void {
  const { ctx, width, height } = rc;
  ctx.fillStyle = COLOR.gray900;
  ctx.fillRect(0, 0, width, height);
}

function drawTimeRuler(rc: RenderContext): void {
  const { ctx, width, view, bpm } = rc;
  const secPerBeat = 60 / bpm;
  const secPerBar = secPerBeat * 4;

  // Ruler background
  ctx.fillStyle = COLOR.black;
  ctx.fillRect(0, 0, width, RULER_HEIGHT);

  // Bar labels
  ctx.font = `${String(TEXT_XS)}px ${FONT_MONO}`;
  ctx.fillStyle = COLOR.gray500;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const startBar = Math.max(0, Math.floor(view.scrollX / secPerBar));
  const endSec =
    view.scrollX + (width - view.headerWidth) / view.pixelsPerSecond;
  const endBar = Math.ceil(endSec / secPerBar) + 1;

  for (let bar = startBar; bar < endBar; bar++) {
    const x = secondsToX(bar * secPerBar, view);
    if (x >= view.headerWidth && x <= width) {
      ctx.fillText(String(bar + 1), x, RULER_HEIGHT / 2);
    }
  }
}

function drawGrid(rc: RenderContext): void {
  const { ctx, width, height, view, bpm } = rc;
  const secPerBeat = 60 / bpm;
  const secPerBar = secPerBeat * 4;

  // Determine visible range in seconds
  const startSec = view.scrollX;
  const endSec =
    view.scrollX + (width - view.headerWidth) / view.pixelsPerSecond;

  // Determine grid step -- skip beats when zoomed out too far
  const minPxPerLine = 12;
  let step = secPerBeat;
  while (step * view.pixelsPerSecond < minPxPerLine) {
    step *= 2;
  }

  const firstBeat = Math.floor(startSec / step) * step;

  ctx.save();
  for (let t = firstBeat; t <= endSec; t += step) {
    const x = secondsToX(t, view);
    if (x < view.headerWidth || x > width) continue;

    // Check if this line sits on a bar boundary (use integer arithmetic to avoid float drift)
    const nearestBar = Math.round(t / secPerBar) * secPerBar;
    const isBar = Math.abs(t - nearestBar) < 0.001;
    ctx.strokeStyle = COLOR.gray700;
    ctx.lineWidth = isBar ? 2 : 1;

    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrackLanes(rc: RenderContext): void {
  const { ctx, width, view, tracks } = rc;

  for (let i = 0; i < tracks.length; i++) {
    const y = trackY(i, view);
    const bottom = y + view.trackHeight;

    if (bottom < RULER_HEIGHT || y > rc.height) continue;

    // Lane separator
    ctx.strokeStyle = COLOR.gray700;
    ctx.lineWidth = BORDER_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    ctx.lineTo(width, bottom);
    ctx.stroke();
  }
}

function drawTrackHeaders(rc: RenderContext): void {
  const { ctx, view, tracks } = rc;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    if (track === undefined) continue;
    const y = trackY(i, view);

    if (y + view.trackHeight < RULER_HEIGHT || y > rc.height) continue;

    // Header background
    ctx.fillStyle = COLOR.black;
    ctx.fillRect(0, y, view.headerWidth, view.trackHeight);

    // Color strip (4px vertical bar)
    ctx.fillStyle = track.color;
    ctx.fillRect(0, y, COLOR_STRIP_WIDTH, view.trackHeight);

    // Track name
    ctx.font = `${String(TEXT_SM)}px ${FONT_MONO}`;
    ctx.fillStyle = COLOR.white;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(track.name, COLOR_STRIP_WIDTH + 8, y + view.trackHeight / 2);

    // Armed indicator (hot pink per R-STA-02)
    if (track.armed) {
      ctx.fillStyle = COLOR.pink;
      ctx.fillRect(0, y, COLOR_STRIP_WIDTH, view.trackHeight);
    }

    // Mute/Solo indicators
    const indicatorY = y + view.trackHeight / 2;
    ctx.font = `bold ${String(TEXT_XS)}px ${FONT_MONO}`;
    ctx.textAlign = "center";

    if (track.armed) {
      ctx.fillStyle = COLOR.pink;
      ctx.fillText("R", view.headerWidth - 54, indicatorY);
    }
    if (track.muted) {
      ctx.fillStyle = COLOR.gray500;
      ctx.fillText("M", view.headerWidth - 36, indicatorY);
    }
    if (track.solo) {
      ctx.fillStyle = COLOR.gray500;
      ctx.fillText("S", view.headerWidth - 18, indicatorY);
    }

    // Delete button (X in top-right corner)
    const btnX = view.headerWidth - DELETE_BTN_SIZE - DELETE_BTN_MARGIN;
    const btnY = y + DELETE_BTN_MARGIN;
    ctx.fillStyle = COLOR.gray700;
    ctx.fillRect(btnX, btnY, DELETE_BTN_SIZE, DELETE_BTN_SIZE);
    ctx.strokeStyle = COLOR.gray500;
    ctx.lineWidth = 1.5;
    const inset = 4;
    ctx.beginPath();
    ctx.moveTo(btnX + inset, btnY + inset);
    ctx.lineTo(btnX + DELETE_BTN_SIZE - inset, btnY + DELETE_BTN_SIZE - inset);
    ctx.moveTo(btnX + DELETE_BTN_SIZE - inset, btnY + inset);
    ctx.lineTo(btnX + inset, btnY + DELETE_BTN_SIZE - inset);
    ctx.stroke();

    // Header right border
    ctx.strokeStyle = COLOR.gray700;
    ctx.lineWidth = BORDER_WIDTH;
    ctx.beginPath();
    ctx.moveTo(view.headerWidth, y);
    ctx.lineTo(view.headerWidth, y + view.trackHeight);
    ctx.stroke();
  }
}

function drawClips(rc: RenderContext): void {
  const { ctx, view, tracks, clips, selectedClipIds } = rc;
  const selectedSet = new Set(selectedClipIds);

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    if (track === undefined) continue;
    const y = trackY(i, view);

    if (y + view.trackHeight < RULER_HEIGHT || y > rc.height) continue;

    for (const clipId of track.clipIds) {
      const clip = clips[clipId];
      if (clip === undefined) continue;

      const x = secondsToX(clip.startTime, view);
      const w = clip.duration * view.pixelsPerSecond;

      // Skip clips that are fully out of view
      if (x + w < view.headerWidth || x > rc.width) continue;

      const clipY = y + CLIP_PADDING;
      const clipH = view.trackHeight - CLIP_PADDING * 2;

      // Clip fill (track color at 60% opacity)
      ctx.fillStyle = hexToRgba(track.color, 0.6);
      ctx.fillRect(x, clipY, w, clipH);

      // MIDI note visualization (MIDI clips)
      if (isMidiClip(clip) && clip.noteEvents.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, clipY, w, clipH);
        ctx.clip();

        // Find pitch range of notes in this clip
        let minPitch = 127;
        let maxPitch = 0;
        for (const note of clip.noteEvents) {
          if (note.pitch < minPitch) minPitch = note.pitch;
          if (note.pitch > maxPitch) maxPitch = note.pitch;
        }
        // Add padding so notes don't sit at the very edges
        const pitchRange = Math.max(1, maxPitch - minPitch + 2);
        const noteAreaTop = clipY + 14; // leave room for clip name
        const noteAreaH = clipH - 16;
        const rowH = Math.max(1, Math.min(4, noteAreaH / pitchRange));

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        for (const note of clip.noteEvents) {
          const nx = x + (note.startTime / clip.duration) * w;
          const nw = Math.max(1, (note.duration / clip.duration) * w);
          const pitchOffset = maxPitch + 1 - note.pitch;
          const ny = noteAreaTop + (pitchOffset / pitchRange) * noteAreaH;
          ctx.fillRect(nx, ny, nw, rowH);
        }

        ctx.restore();
      }

      // Waveform peaks (audio clips only)
      if (isAudioClip(clip)) {
        const peakData = rc.clipPeaks?.[clip.id];
        if (peakData && peakData.length > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, clipY, w, clipH);
          ctx.clip();

          ctx.fillStyle = "rgba(255,255,255,0.4)";
          const mid = clipY + clipH / 2;
          const halfH = clipH / 2;
          const barWidth = Math.max(1, w / peakData.length);

          for (let p = 0; p < peakData.length; p++) {
            const min = peakData.peaks[p * 2];
            const max = peakData.peaks[p * 2 + 1];
            if (min === undefined || max === undefined) continue;
            const px = x + (p / peakData.length) * w;
            const top = mid - max * halfH;
            const bottom = mid - min * halfH;
            ctx.fillRect(px, top, barWidth, bottom - top);
          }

          ctx.restore();
        }
      }

      // Clip border
      const isSelected = selectedSet.has(clip.id);
      ctx.strokeStyle = isSelected ? COLOR.white : track.color;
      ctx.lineWidth = BORDER_WIDTH;
      ctx.strokeRect(x, clipY, w, clipH);

      // Clip name label
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, clipY, w, clipH);
      ctx.clip();
      ctx.font = `${String(TEXT_XS)}px ${FONT_MONO}`;
      ctx.fillStyle = COLOR.white;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(clip.name, x + 4, clipY + 4);
      ctx.restore();
    }
  }
}

const AUTOMATION_LINE_COLOR = "#00ccff";
const AUTOMATION_POINT_RADIUS = 3;
const AUTOMATION_SAMPLES_PER_PX = 4; // evaluate every 4 pixels for smooth curves

function drawAutomationLanes(rc: RenderContext): void {
  const { ctx, view, tracks, automationLanes } = rc;
  if (!automationLanes) return;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    if (track === undefined) continue;
    const lanes = automationLanes[track.id];
    if (!lanes || lanes.length === 0) continue;

    const y = trackY(i, view);
    const laneBottom = y + view.trackHeight;
    if (laneBottom < RULER_HEIGHT || y > rc.height) continue;

    for (const lane of lanes) {
      if (lane.points.length === 0) continue;

      ctx.save();

      // Clip to track lane area (past the header)
      ctx.beginPath();
      ctx.rect(
        view.headerWidth,
        y + CLIP_PADDING,
        rc.width - view.headerWidth,
        view.trackHeight - CLIP_PADDING * 2,
      );
      ctx.clip();

      // Draw the curve as connected line segments
      const startSec = view.scrollX;
      const endSec =
        view.scrollX + (rc.width - view.headerWidth) / view.pixelsPerSecond;
      const step = AUTOMATION_SAMPLES_PER_PX / view.pixelsPerSecond;
      const laneH = view.trackHeight - CLIP_PADDING * 2;
      const laneTop = y + CLIP_PADDING;

      ctx.strokeStyle = AUTOMATION_LINE_COLOR;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      let first = true;
      for (let t = startSec; t <= endSec; t += step) {
        const val = evaluateCurve(lane.points, t);
        const px = secondsToX(t, view);
        const py = laneTop + laneH * (1 - val); // 1.0 at top, 0.0 at bottom
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Draw point handles
      ctx.fillStyle = AUTOMATION_LINE_COLOR;
      for (const pt of lane.points) {
        const px = secondsToX(pt.time, view);
        const py = laneTop + laneH * (1 - pt.value);
        if (px < view.headerWidth || px > rc.width) continue;

        ctx.beginPath();
        ctx.arc(px, py, AUTOMATION_POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

function drawPlayhead(rc: RenderContext): void {
  const { ctx, height, view, cursorSeconds } = rc;
  const x = secondsToX(cursorSeconds, view);

  if (x < view.headerWidth || x > rc.width) return;

  ctx.strokeStyle = COLOR.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
}

// -- Public API ---------------------------------------------------------------

function drawLoopRegion(rc: RenderContext): void {
  if (
    rc.loopEnabled !== true ||
    rc.loopStart === undefined ||
    rc.loopEnd === undefined
  )
    return;
  if (rc.loopEnd <= rc.loopStart) return;

  const { ctx, height, view } = rc;
  const x1 = secondsToX(rc.loopStart, view);
  const x2 = secondsToX(rc.loopEnd, view);

  // Skip if completely out of view
  if (x2 < view.headerWidth || x1 > rc.width) return;

  const left = Math.max(view.headerWidth, x1);
  const right = Math.min(rc.width, x2);

  // Tinted overlay on the loop region
  ctx.fillStyle = "rgba(0, 102, 255, 0.08)";
  ctx.fillRect(left, RULER_HEIGHT, right - left, height - RULER_HEIGHT);

  // Loop boundary lines
  ctx.strokeStyle = COLOR.blue;
  ctx.lineWidth = 2;
  if (x1 >= view.headerWidth) {
    ctx.beginPath();
    ctx.moveTo(x1, 0);
    ctx.lineTo(x1, height);
    ctx.stroke();
  }
  if (x2 <= rc.width) {
    ctx.beginPath();
    ctx.moveTo(x2, 0);
    ctx.lineTo(x2, height);
    ctx.stroke();
  }

  // Loop bar in ruler
  ctx.fillStyle = "rgba(0, 102, 255, 0.3)";
  ctx.fillRect(left, 0, right - left, RULER_HEIGHT);
}

export function renderArrangement(rc: RenderContext): void {
  drawBackground(rc);
  drawTimeRuler(rc);
  drawGrid(rc);
  drawLoopRegion(rc);
  drawTrackLanes(rc);
  drawTrackHeaders(rc);
  drawClips(rc);
  drawAutomationLanes(rc);
  drawPlayhead(rc);
}
