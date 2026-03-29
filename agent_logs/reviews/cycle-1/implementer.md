Committed successfully. All pre-commit hooks passed (lint, typecheck, format).

**Summary of fixes applied:**

| Finding | Severity | Fix |
|---------|----------|-----|
| Biquad coefficients zero on voice allocation | P2 | `computeBiquadCoeffs()` called in `allocateNoteOn` immediately after filter reset |
| LFO computed but discarded in hot loop | P2 | Removed `lfo.process()` calls from inner sample loop |
| `cancelFlag` shared between concurrent bounces | P2 | Added `bouncing` guard that throws + `try/finally` to reset |
| `WAV_CHUNK_SAMPLES` hardcoded to 44100 | P2 | Changed to `WAV_CHUNK_SECONDS * sampleRate` |
| No `sampleRate` validation | P3 | Guard at bounce boundary throws for `<= 0` |
| `startRendering()` not interruptible | P2 | Documented limitation as comment |
| `mapPitchToDrum` re-creates object per call | P3 | Hoisted `PITCH_TO_DRUM` to module scope |
| `faderTaper` deep import bypasses barrel | P3 | Added export to `mixer/index.ts`, updated import |
| Non-mixer automation silently skipped | P3 | Added documenting comment |

**1323 tests pass, TypeScript clean, lint clean.**

FIXES_APPLIED
