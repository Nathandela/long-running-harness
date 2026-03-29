Let me verify each original finding against the fix:

**Finding 1 (P2 - Drop handler missing undo)**: Fixed. `handleDrop` now uses `new AddClipCommand(clip)` + `sharedUndoManager.push(cmd)` at `ArrangementPanel.tsx:117-119`.

**Finding 2 (P2 - No field validation on parsed JSON)**: Fixed. Parse result is typed as `unknown`, then cast to `Record<string, unknown>`, with explicit `typeof` guards for all three fields at `ArrangementPanel.tsx:77-83`.

**Finding 3 (P2 - Negative trackIndex)**: Fixed. Explicit `if (trackIndex < 0) return;` guard at `ArrangementPanel.tsx:93`. Additionally, `handleDragOver` also guards with `trackIndex >= 0` at line 56.

**Finding 4 (P3 - Stale clipId)**: Fixed. `DawShell.tsx:58-63` subscribes to the store with `useDawStore` to check `clipStillExists`, and derives `effectivePanel` that falls back to `"default"` when the clip no longer exists.

**Finding 5 (P3 - Test doesn't test open-then-close)**: Fixed. The test now mocks `ArrangementPanel` to capture the `onOpenPianoRoll` callback, invokes it with `act`, asserts the piano roll is visible, clicks the close button with `userEvent.click`, and asserts it returns to default layout.

One minor observation: the `handleDragOver` now calls `useDawStore.getState()` on every dragover event (fires rapidly during drag), which is fine since Zustand's `getState()` is synchronous and cheap -- no concern here.

REVIEW_APPROVED
