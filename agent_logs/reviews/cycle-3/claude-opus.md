All 986 tests pass (one new test added), TypeScript compiles clean. The three P1/P2 fixes from my previous review are correctly applied:

1. **P1 sentinel fix**: `oldStartTime`/`oldPitch`/`oldDuration` now use `number | undefined` with `=== undefined` guard.
2. **P2 left-edge resize**: Drag state carries `edge` and `origStartTime`; left-edge adjusts both `startTime` and `duration`; pointerUp pushes a `BatchNoteCommand` for undo.
3. **P2 draw-note redo**: pointerUp now captures a `ResizeNoteCommand` when the final duration differs from the initial grid-step size.

REVIEW_APPROVED
