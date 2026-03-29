All four findings from my previous review are addressed:

- **P1 (undo for drop)**: `handleDrop` now uses `AddClipCommand` + `sharedUndoManager.push`.
- **P2 (drag cursor over non-audio tracks)**: `handleDragOver` now resolves the track from y-position and only sets `dropEffect = "copy"` on audio tracks.
- **P2 (misleading test)**: Test rewritten to capture `onOpenPianoRoll` callback via mock, trigger it, assert piano roll opens, click close, assert default returns.
- **P3 (inline undo / redundant addMidiClip)**: Inline command replaced with `new AddClipCommand(clip)` throughout.

The stale `editingClipId` fix (panel falls back to default when clip is deleted via undo) was a bonus finding addressed correctly via the `clipStillExists` selector.

REVIEW_APPROVED
