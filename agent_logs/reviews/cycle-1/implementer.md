All checks pass, committed. 

FIXES_APPLIED

**Summary of fixes:**

| Finding | Fix |
|---------|-----|
| **P1 - Multi-delete undo not atomic** | Added `BatchCommand` class to undo system. Multi-delete of clips/tracks now wraps all sub-commands in a single `BatchCommand` -- one Ctrl+Z undoes the entire batch. |
| **P1/P2 - MIDI clip trim doesn't adjust noteEvents** | Left-edge trim now shifts note start times by the delta and filters notes that fall outside `[0, duration)`. Right-edge trim filters notes past the new duration. |
| **P2 - Unsafe cast in onCommitToTimeline** | Replaced `Object.keys(step.triggers) as DrumInstrumentId[]` with iteration over `DRUM_INSTRUMENTS` -- type-safe, no cast needed. |
| **P3 - Orphaned comment** | Removed the redundant `// mapPitchToDrum imported from...` comment. |

All 1551 tests pass. Lint + Prettier clean.
