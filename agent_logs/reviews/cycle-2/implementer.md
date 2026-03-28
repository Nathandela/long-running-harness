All fixes applied and committed. Here's the summary:

**P1 Fixed: Fade-out gain envelope when seeking into active fade-out** (Codex finding)
- `clip-scheduler.ts:107-122`: When `seekOffset` lands in the fade-out region, now computes the correct partial gain (`clip.gain * (1 - fadeOutProgress)`) and schedules from `playStartCtx` instead of the stale `fadeOutStartCtx`. Mirrors the existing fade-in mid-seek logic.
- Added regression test verifying a seek 1s into a 4s fade-out produces the expected 0.6 gain (75% of 0.8).

**P2 Not actioned: MixerEngine not wired** (Gemini finding)
- Both Sonnet and Opus reviews confirmed this is intentional deferred work for E13 (Advanced Mixer Routing). The index export already documents this intent.

**Test results**: 54/54 mixer tests pass (11 clip-scheduler tests including the new regression test).

FIXES_APPLIED
