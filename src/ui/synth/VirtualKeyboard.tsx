/**
 * Virtual piano keyboard for mouse-triggered notes.
 * 2-octave range (C3-B4) with black/white keys.
 * Neo-brutalist styling with thick borders.
 */

import { useCallback, useRef } from "react";
import { tokens } from "@ui/tokens/tokens";

type VirtualKeyboardProps = {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
};

const OCTAVE_START = 48; // C3
const NUM_OCTAVES = 2;

/** White key indices within an octave (C D E F G A B) */
const WHITE_KEY_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
/** Black key indices within an octave */
const BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];
/** Black key positions relative to white keys (0-indexed from C) */
const BLACK_KEY_POSITIONS = [0.7, 1.7, 3.7, 4.7, 5.7];

const WHITE_KEY_WIDTH = 28;
const WHITE_KEY_HEIGHT = 80;
const BLACK_KEY_WIDTH = 18;
const BLACK_KEY_HEIGHT = 50;

const WHITE_KEY_BORDER =
  String(tokens.border.width) + "px solid " + tokens.color.black;
const BLACK_KEY_BORDER =
  String(tokens.border.width) + "px solid " + tokens.color.gray700;

export function VirtualKeyboard({
  onNoteOn,
  onNoteOff,
}: VirtualKeyboardProps): React.JSX.Element {
  const activeNotes = useRef(new Set<number>());

  const handleMouseDown = useCallback(
    (note: number) => {
      // Release first if already active (prevents stuck notes on rapid clicks)
      if (activeNotes.current.has(note)) {
        onNoteOff(note);
      }
      activeNotes.current.add(note);
      onNoteOn(note, 100);
    },
    [onNoteOn, onNoteOff],
  );

  const handleMouseUp = useCallback(
    (note: number) => {
      if (activeNotes.current.has(note)) {
        activeNotes.current.delete(note);
        onNoteOff(note);
      }
    },
    [onNoteOff],
  );

  const handleMouseLeave = useCallback(
    (note: number) => {
      if (activeNotes.current.has(note)) {
        activeNotes.current.delete(note);
        onNoteOff(note);
      }
    },
    [onNoteOff],
  );

  const whiteKeys: React.JSX.Element[] = [];
  const blackKeys: React.JSX.Element[] = [];

  let whiteIndex = 0;

  for (let octave = 0; octave < NUM_OCTAVES; octave++) {
    for (const offset of WHITE_KEY_OFFSETS) {
      const note = OCTAVE_START + octave * 12 + offset;
      const x = whiteIndex * WHITE_KEY_WIDTH;
      whiteKeys.push(
        <div
          key={"w-" + String(note)}
          data-testid={"key-" + String(note)}
          onMouseDown={() => {
            handleMouseDown(note);
          }}
          onMouseUp={() => {
            handleMouseUp(note);
          }}
          onMouseLeave={() => {
            handleMouseLeave(note);
          }}
          style={{
            position: "absolute",
            left: x,
            top: 0,
            width: WHITE_KEY_WIDTH,
            height: WHITE_KEY_HEIGHT,
            backgroundColor: tokens.color.white,
            border: WHITE_KEY_BORDER,
            cursor: "pointer",
            userSelect: "none",
            zIndex: 1,
          }}
        />,
      );
      whiteIndex++;
    }

    for (let bi = 0; bi < BLACK_KEY_OFFSETS.length; bi++) {
      const offset = BLACK_KEY_OFFSETS[bi] ?? 0;
      const pos = BLACK_KEY_POSITIONS[bi] ?? 0;
      const note = OCTAVE_START + octave * 12 + offset;
      const x =
        (octave * WHITE_KEY_OFFSETS.length + pos) * WHITE_KEY_WIDTH +
        (WHITE_KEY_WIDTH - BLACK_KEY_WIDTH) / 2;

      blackKeys.push(
        <div
          key={"b-" + String(note)}
          data-testid={"key-" + String(note)}
          onMouseDown={() => {
            handleMouseDown(note);
          }}
          onMouseUp={() => {
            handleMouseUp(note);
          }}
          onMouseLeave={() => {
            handleMouseLeave(note);
          }}
          style={{
            position: "absolute",
            left: x,
            top: 0,
            width: BLACK_KEY_WIDTH,
            height: BLACK_KEY_HEIGHT,
            backgroundColor: tokens.color.black,
            border: BLACK_KEY_BORDER,
            cursor: "pointer",
            userSelect: "none",
            zIndex: 2,
          }}
        />,
      );
    }
  }

  const totalWidth = whiteIndex * WHITE_KEY_WIDTH;

  return (
    <div
      data-testid="virtual-keyboard"
      style={{
        position: "relative",
        width: totalWidth,
        height: WHITE_KEY_HEIGHT,
        flexShrink: 0,
      }}
    >
      {whiteKeys}
      {blackKeys}
    </div>
  );
}
