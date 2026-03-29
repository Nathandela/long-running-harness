All 1551 tests pass, lint clean (only pre-existing warnings), types clean.

**Fixes applied:**

- **P1 (Codex)**: Moved `setBridgeRef` wiring from `InstrumentPanel` (which unmounts when piano-roll opens) to `TrackAudioBridgeProvider` (always mounted). Drum playback now persists regardless of which bottom panel is visible.
- **P2 (Gemini)**: Track delete button now requires double-click (`e.detail < 2` guard), preventing accidental single-click deletions. Undo still works as a safety net.

FIXES_APPLIED
