All pre-commit hooks (lint, format, tsc) pass. Committed successfully.

FIXES_APPLIED

**Summary of all fixes:**

| Severity | Issue | Fix |
|----------|-------|-----|
| **P1** | Left-edge resize broken (stretched rightward) | Added `edge` field to drag state; left-edge now moves `startTime` and shrinks `duration` inversely; batch undo command for left-edge |
| **P1** | Draw-note redo loses dragged duration | Push `ResizeNoteCommand` on `pointerUp` when duration differs from initial grid-step |
| **P2** | `MoveNoteCommand` sentinel 0 corrupts undo at origin | Changed sentinel from `0` to `undefined` |
| **P2** | `ResizeNoteCommand` same sentinel issue | Changed sentinel from `0` to `undefined` |
| **P2** | `handleWheel` `preventDefault()` no-op on passive listener | Replaced React `onWheel` with `useEffect` + `addEventListener({ passive: false })` |
| **P2** | `scrollY` unbounded | Clamped to `[PR_MIN_NOTE, PR_MAX_NOTE]` (0-127) |
| **P2** | Canvas blank on resize while stopped | `ResizeObserver` callback now calls `render()` after resizing |
| **P2** | `registry` useMemo recreated every render | Depends on stable `deleteSelectedNotes` instead of `interactions` object |
| **P3** | `pitchToY` unused params | Removed `_height` and `_velocityLaneHeight`; updated all callers |

985/985 tests pass. TypeScript, ESLint, Prettier all clean.
