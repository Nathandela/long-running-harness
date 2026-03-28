All 985 tests pass, TypeScript compiles clean. Let me verify the three fixes address the original findings:

**Finding 1 (P1 sentinel value)**: Fixed. `oldStartTime`/`oldPitch` are now `number | undefined`, checked against `undefined` instead of `0`. `oldDuration` same treatment. Undo fallback uses `?? 0` which is safe since `undefined` only occurs if `execute()` was never called (shouldn't happen in normal flow).

**Finding 2 (P2 left-edge resize)**: Fixed. Drag state now carries `edge: "left" | "right"` and `origStartTime`. Left-edge drag adjusts both `startTime` (via `moveNoteEvent`) and `duration` (via `resizeNoteEvent`) inversely. On pointerUp, left-edge creates a `BatchNoteCommand` with both move and resize sub-commands for correct undo. The pitch lookup `getNotes().find(...)?.pitch ?? 0` is a minor edge case (falls back to 0 if note vanishes mid-drag), but acceptable.

**Finding 3 (P2 draw-note redo)**: Fixed. `onPointerUp` now handles `draw-note` by comparing the note's final duration to the initial grid-step duration and pushing a `ResizeNoteCommand` if they differ. Redo will now replay both the add (initial size) and the resize (final size).

The remaining P2/P3 findings (passive wheel listener, unbounded scrollY, CommandRegistry re-creation, module-level nextNoteId) were not addressed but are lower severity and acceptable to defer.

REVIEW_APPROVED
