All 60 tests pass across 5 test files. FIXES_APPLIED

**Summary of fixes:**

| # | Sev | Fix | File |
|---|-----|-----|------|
| 1 | P1 | `disconnectFromMixer` now disconnects from specific strip via `output.disconnect(strip.inputGain)` | drum-kit.ts:146 |
| 2 | P1 | `activeOH` cleared in "ended" callback when OH decays naturally | drum-kit.ts:83-86 |
| 3 | P1 | `peakGain` clamped to `Math.max(0.001, ...)` preventing `exponentialRampToValueAtTime` crash on zero volume | drum-kit.ts:65 |
| 4 | P2 | Velocity clamped to `Math.min(1, velocity)` at engine boundary | drum-kit.ts:65 |
| 5 | P2 | Dead `onSetFlam` prop removed from `DrumMachinePanelProps` | DrumMachinePanel.tsx |
| 6 | P2 | Knob min/max derived from `PARAM_RANGES` instead of hardcoded literals | DrumMachinePanel.tsx:142-182 |
| 7 | P2 | `completedSteals.length` truncation replaced with `{data, count}` `StealResult` pair to preserve pre-allocated array | voice-allocator.ts |
| 8 | P3 | OH flam voice tracked in `activeOHFlam` so CH properly chokes both primary and flam tails | drum-kit.ts |
