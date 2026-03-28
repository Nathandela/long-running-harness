REVIEW_CHANGES_REQUESTED

**1. P1 — Drag interactions still bypass undo system (unchanged)**

`use-arrangement-interactions.ts` was not modified. `onMouseMove` still calls `state.moveClip` / `state.trimClip` directly, and `onDoubleClick` still calls `state.splitClip` directly. `onMouseUp` still just resets drag state without committing an undo entry. All mouse-driven clip mutations remain non-undoable.
