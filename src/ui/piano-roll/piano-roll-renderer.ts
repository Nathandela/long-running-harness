/**
 * Pure canvas renderer for the piano roll editor.
 * No DOM access -- only draws to the CanvasRenderingContext2D passed in.
 */
import type { MIDINoteEvent } from "@state/track/types";
import { PR_RULER_HEIGHT } from "./constants";

// -- Design token constants (canvas cannot read CSS vars) ---------------------

const COLOR = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  blue: "#0066ff",
  gray900: "#111111",
  gray800: "#1a1a1a",
  gray700: "#333333",
  gray500: "#666666",
  gray400: "#888888",
  whiteKeyRow: "#242424",
  blackKeyRow: "#161616",
  whiteKey: "#e0e0e0",
  blackKey: "#2a2a2a",
} as const;

const FONT_MONO = "'JetBrains Mono', monospace" as const;
const TEXT_XS = 10;
const BORDER_WIDTH = 2;

// -- Public types -------------------------------------------------------------

export type PianoRollViewState = {
  scrollX: number; // seconds
  scrollY: number; // MIDI note number at top (0-127, higher = higher pitch)
  pixelsPerSecond: number; // horizontal zoom
  noteHeight: number; // pixels per semitone
  keyboardWidth: number; // width of piano keyboard sidebar
};

export type PianoRollTool = "pencil" | "select" | "erase";

export type PianoRollRenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  view: PianoRollViewState;
  notes: readonly MIDINoteEvent[];
  selectedNoteIds: readonly string[];
  cursorSeconds: number;
  bpm: number;
  clipStartTime: number; // absolute timeline position of the clip
  clipDuration: number;
  tool: PianoRollTool;
  velocityLaneHeight: number; // height of velocity lane at bottom
};

// -- Helpers ------------------------------------------------------------------

export function secondsToX(seconds: number, view: PianoRollViewState): number {
  return view.keyboardWidth + (seconds - view.scrollX) * view.pixelsPerSecond;
}

export function pitchToY(pitch: number, view: PianoRollViewState): number {
  return PR_RULER_HEIGHT + (view.scrollY - pitch) * view.noteHeight;
}

export function isBlackKey(pitch: number): boolean {
  const pc = pitch % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

export function noteName(pitch: number): string {
  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = Math.floor(pitch / 12) - 1;
  return (names[pitch % 12] ?? "") + String(octave);
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

function drawBackground(rc: PianoRollRenderContext): void {
  const { ctx, width, height } = rc;
  ctx.fillStyle = COLOR.gray900;
  ctx.fillRect(0, 0, width, height);
}

function drawNoteGrid(rc: PianoRollRenderContext): void {
  const { ctx, width, height, view, velocityLaneHeight } = rc;
  const gridBottom = height - velocityLaneHeight;

  // Clip to grid area
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    view.keyboardWidth,
    PR_RULER_HEIGHT,
    width - view.keyboardWidth,
    gridBottom - PR_RULER_HEIGHT,
  );
  ctx.clip();

  // Use integer pitches so grid rows align with note positions
  const topPitch = Math.ceil(view.scrollY);
  const visibleRows =
    Math.ceil((gridBottom - PR_RULER_HEIGHT) / view.noteHeight) + 1;
  const bottomPitch = topPitch - visibleRows;

  for (let pitch = topPitch; pitch >= bottomPitch; pitch--) {
    const y = pitchToY(pitch, view);
    if (y + view.noteHeight < PR_RULER_HEIGHT || y > gridBottom) continue;

    // Row fill: distinct shading for white vs black key rows
    ctx.fillStyle = isBlackKey(pitch) ? COLOR.blackKeyRow : COLOR.whiteKeyRow;
    ctx.fillRect(
      view.keyboardWidth,
      y,
      width - view.keyboardWidth,
      view.noteHeight,
    );

    // Horizontal separator -- stronger line at C notes (octave boundaries)
    const isC = pitch % 12 === 0;
    ctx.strokeStyle = isC ? COLOR.gray500 : COLOR.gray700;
    ctx.lineWidth = isC ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(view.keyboardWidth, y + view.noteHeight);
    ctx.lineTo(width, y + view.noteHeight);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTimeGrid(rc: PianoRollRenderContext): void {
  const { ctx, width, height, view, bpm, velocityLaneHeight } = rc;
  const secPerBeat = 60 / bpm;
  const secPerBar = secPerBeat * 4;
  const gridBottom = height - velocityLaneHeight;

  const startSec = view.scrollX;
  const endSec =
    view.scrollX + (width - view.keyboardWidth) / view.pixelsPerSecond;

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
    if (x < view.keyboardWidth || x > width) continue;

    const nearestBar = Math.round(t / secPerBar) * secPerBar;
    const isBar = Math.abs(t - nearestBar) < 0.001;
    ctx.strokeStyle = COLOR.gray700;
    ctx.lineWidth = isBar ? 2 : 1;

    ctx.beginPath();
    ctx.moveTo(x, PR_RULER_HEIGHT);
    ctx.lineTo(x, gridBottom);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNotes(rc: PianoRollRenderContext): void {
  const { ctx, view, height, notes, selectedNoteIds, velocityLaneHeight } = rc;
  const gridBottom = height - velocityLaneHeight;
  const selectedSet = new Set(selectedNoteIds);

  // Clip notes to grid area
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    view.keyboardWidth,
    PR_RULER_HEIGHT,
    rc.width - view.keyboardWidth,
    gridBottom - PR_RULER_HEIGHT,
  );
  ctx.clip();

  for (const note of notes) {
    const x = secondsToX(note.startTime, view);
    const w = note.duration * view.pixelsPerSecond;
    const y = pitchToY(note.pitch, view);
    const h = view.noteHeight;

    // Skip notes fully out of view
    if (x + w < view.keyboardWidth || x > rc.width) continue;
    if (y + h < PR_RULER_HEIGHT || y > height - velocityLaneHeight) continue;

    // Fill
    ctx.fillStyle = hexToRgba(COLOR.blue, 0.8);
    ctx.fillRect(x, y, w, h);

    // Border
    const isSelected = selectedSet.has(note.id);
    ctx.strokeStyle = isSelected ? COLOR.white : COLOR.blue;
    ctx.lineWidth = BORDER_WIDTH;
    ctx.strokeRect(x, y, w, h);
  }

  ctx.restore();
}

function drawKeyboard(rc: PianoRollRenderContext): void {
  const { ctx, view, height, velocityLaneHeight } = rc;
  const gridBottom = height - velocityLaneHeight;

  // Clip keyboard to its area
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    0,
    PR_RULER_HEIGHT,
    view.keyboardWidth,
    gridBottom - PR_RULER_HEIGHT,
  );
  ctx.clip();

  // Keyboard background
  ctx.fillStyle = COLOR.black;
  ctx.fillRect(
    0,
    PR_RULER_HEIGHT,
    view.keyboardWidth,
    gridBottom - PR_RULER_HEIGHT,
  );

  const topPitch = Math.ceil(view.scrollY);
  const visibleRows =
    Math.ceil((gridBottom - PR_RULER_HEIGHT) / view.noteHeight) + 1;
  const bottomPitch = topPitch - visibleRows;

  // Draw white keys first (full width), then black keys on top (narrower)
  // Pass 1: white keys (full width)
  for (let pitch = topPitch; pitch >= bottomPitch; pitch--) {
    if (isBlackKey(pitch)) continue;
    const y = pitchToY(pitch, view);
    if (y + view.noteHeight < PR_RULER_HEIGHT || y > gridBottom) continue;

    ctx.fillStyle = COLOR.whiteKey;
    ctx.fillRect(0, y, view.keyboardWidth - 1, view.noteHeight);

    // Separator between white keys
    ctx.strokeStyle = COLOR.gray500;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y + view.noteHeight);
    ctx.lineTo(view.keyboardWidth, y + view.noteHeight);
    ctx.stroke();

    // Label every white key with note name
    const label = noteName(pitch);
    ctx.font = `${String(view.noteHeight > 14 ? TEXT_XS : 8)}px ${FONT_MONO}`;
    // C notes get brighter label to mark octave boundaries
    ctx.fillStyle = pitch % 12 === 0 ? COLOR.black : COLOR.gray500;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText(label, view.keyboardWidth - 6, y + view.noteHeight / 2);
  }

  // Pass 2: black keys (narrower, drawn on top)
  for (let pitch = topPitch; pitch >= bottomPitch; pitch--) {
    if (!isBlackKey(pitch)) continue;
    const y = pitchToY(pitch, view);
    if (y + view.noteHeight < PR_RULER_HEIGHT || y > gridBottom) continue;

    const keyWidth = view.keyboardWidth * 0.55;
    ctx.fillStyle = COLOR.blackKey;
    ctx.fillRect(0, y + 1, keyWidth, view.noteHeight - 2);

    // Label black keys too
    const label = noteName(pitch);
    ctx.font = `${String(view.noteHeight > 14 ? TEXT_XS : 8)}px ${FONT_MONO}`;
    ctx.fillStyle = COLOR.gray400;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText(label, keyWidth - 4, y + view.noteHeight / 2);
  }

  ctx.restore();

  // Keyboard right border (drawn outside clip region)
  ctx.strokeStyle = COLOR.gray700;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.beginPath();
  ctx.moveTo(view.keyboardWidth, PR_RULER_HEIGHT);
  ctx.lineTo(view.keyboardWidth, gridBottom);
  ctx.stroke();
}

function drawVelocityLane(rc: PianoRollRenderContext): void {
  const { ctx, width, height, view, notes, velocityLaneHeight } = rc;
  const laneTop = height - velocityLaneHeight;

  // Lane background
  ctx.fillStyle = COLOR.black;
  ctx.fillRect(
    view.keyboardWidth,
    laneTop,
    width - view.keyboardWidth,
    velocityLaneHeight,
  );

  // Separator line
  ctx.strokeStyle = COLOR.gray500;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(view.keyboardWidth, laneTop);
  ctx.lineTo(width, laneTop);
  ctx.stroke();

  // Velocity bars
  for (const note of notes) {
    const x = secondsToX(note.startTime, view);
    const w = note.duration * view.pixelsPerSecond;

    if (x + w < view.keyboardWidth || x > width) continue;

    const barHeight = (note.velocity / 127) * (velocityLaneHeight - 4);
    const barY = laneTop + velocityLaneHeight - barHeight;

    ctx.fillStyle = hexToRgba(COLOR.blue, 0.8);
    ctx.fillRect(x, barY, w, barHeight);
  }
}

function drawPlayhead(rc: PianoRollRenderContext): void {
  const { ctx, height, view, cursorSeconds } = rc;
  const x = secondsToX(cursorSeconds, view);

  if (x < view.keyboardWidth || x > rc.width) return;

  ctx.strokeStyle = COLOR.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
}

function drawRuler(rc: PianoRollRenderContext): void {
  const { ctx, width, view, bpm } = rc;
  const secPerBeat = 60 / bpm;
  const secPerBar = secPerBeat * 4;

  // Ruler background
  ctx.fillStyle = COLOR.black;
  ctx.fillRect(0, 0, width, PR_RULER_HEIGHT);

  // Bar labels
  ctx.font = `${String(TEXT_XS)}px ${FONT_MONO}`;
  ctx.fillStyle = COLOR.gray500;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const startBar = Math.max(0, Math.floor(view.scrollX / secPerBar));
  const endSec =
    view.scrollX + (width - view.keyboardWidth) / view.pixelsPerSecond;
  const endBar = Math.ceil(endSec / secPerBar) + 1;

  for (let bar = startBar; bar < endBar; bar++) {
    const x = secondsToX(bar * secPerBar, view);
    if (x >= view.keyboardWidth && x <= width) {
      ctx.fillText(String(bar + 1), x, PR_RULER_HEIGHT / 2);
    }
  }
}

// -- Public API ---------------------------------------------------------------

export function renderPianoRoll(rc: PianoRollRenderContext): void {
  drawBackground(rc);
  drawNoteGrid(rc);
  drawTimeGrid(rc);
  drawNotes(rc);
  drawKeyboard(rc);
  drawVelocityLane(rc);
  drawPlayhead(rc);
  drawRuler(rc);
}
