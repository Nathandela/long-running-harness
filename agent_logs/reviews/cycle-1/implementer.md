Commit successful. All pre-commit hooks passed (lint, typecheck, format).

FIXES_APPLIED

**Summary of fixes:**

| Finding | Severity | Fix |
|---------|----------|-----|
| Media drop missing undo | P1 | Wrapped `handleDrop` in `AddClipCommand` + `sharedUndoManager.push()` |
| DragOver shows copy cursor on non-audio tracks | P2 | `handleDragOver` now resolves target track and only accepts audio tracks |
| Drop handler no JSON field validation | P2 | Runtime type checks on `sourceId`, `name`, `durationSeconds` |
| Drop handler allows negative trackIndex | P2 | Early return when `trackIndex < 0` |
| Stale `editingClipId` after clip deletion | P2 | Derived `effectivePanel` falls back to "default" when clip no longer exists |
| Misleading piano-roll test | P2/P3 | Rewrote to mock ArrangementPanel, capture callback, test open/close flow |
| MIDI clip undo duplicates AddClipCommand | P3 | Replaced inline undo with `new AddClipCommand(clip)` |
