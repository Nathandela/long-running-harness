All four original findings are addressed in the diffs shown:

- **P1 left-edge resize**: Fixed — `edge: "left" | "right"` added to drag state; left path computes `origEnd = origStartTime + origDuration`, pins the right edge, and calls both `moveNoteEvent` + `resizeNoteEvent`.
- **P2 MoveNoteCommand sentinel**: Fixed — `number | undefined` with `=== undefined` guard.
- **P2 registry useMemo churn**: Fixed — destructured `deleteSelectedNotes` is the sole dependency.
- **P3 pitchToY dead params**: Fixed — signature is now `(pitch, view)`.

No new issues introduced.

REVIEW_APPROVED
