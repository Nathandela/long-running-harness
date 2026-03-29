FIXES_APPLIED

**Summary of all fixes applied:**

| Severity | Finding | Fix |
|----------|---------|-----|
| **P1** | Scheduler never called (Sonnet) | Added `onAdvance` callback to look-ahead scheduler; wired automation scheduler in `use-transport.ts` with ref-based `ParamResolver` |
| **P1** | No duplicate lane guard (Opus) | `addLane` now rejects if a lane with same `ParameterTarget` already exists for the track |
| **P1** | Fixed-step sampling misses transients (Gemini) | Replaced `SCHEDULE_STEPS=4` with `findPointsInRange()` — schedules at exact breakpoint times within each window |
| **P2** | `cancelAndHoldAtTime` (Opus) | Uses `cancelAndHoldAtTime` when available, falls back to `cancelScheduledValues` |
| **P2** | `scheduledParams` leak (Sonnet/Opus/Gemini) | Rebuilt per-window; `cancelAll` uses try/catch for disposed params |
| **P2** | No value/time clamping (Opus) | `insertPoint` and `movePoint` now clamp time >= 0, value to [0,1] |
| **P3** | Zero-length window (Sonnet) | Early return when `windowEnd <= windowStart` |
| **P3** | Test helpers in public API (Sonnet) | Removed `_resetLaneCounter`/`_seedLaneCounter` from `index.ts` exports |

All **1279 tests passing**, clean typecheck, clean lint.
