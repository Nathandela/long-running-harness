All checks pass. 318 tests green, types clean, lint clean.

FIXES_APPLIED

**What was fixed:**
- **P1**: `importingRef.current` now resets in a `finally` block — exception during import no longer permanently locks the UI
- **P1**: `seek()` now reads back `clock.getCursorSeconds()` instead of passing raw input to the store — negative seeks no longer desync UI from transport
- **P2**: `importFile` now rolls back the blob if `putMeta`/`putPeaks` fails — no more orphaned blobs consuming IDB quota
