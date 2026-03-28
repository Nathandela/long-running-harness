All clean. Here's a summary of every fix applied:

**P0 — Build failure fixed:**
- `EffectPanel.tsx`: Added `| undefined` to optional prop types for `exactOptionalPropertyTypes` compliance

**P1 — Allpass topology fixed:**
- `freeverb.ts`: Added explicit `sum` node so feedforward comes from `v[n]` (sum of input + feedback) instead of raw `x[n]`, making the allpass stages true allpass filters and eliminating the ~5x gain boost

**P2 — All addressed:**
- **Sample rate**: Replaced hardcoded `44100` with `ctx.sampleRate` in both comb and allpass delay calculations
- **Width no-op**: Removed `width` parameter from schema, `applyParam`, and all tests
- **Damping**: Added `BiquadFilterNode` (lowpass) inside each comb filter's feedback loop for proper Schroeder frequency-dependent decay, replacing the incorrect uniform gain reduction
- **A/B swap mix**: `handleSwapReverb` now carries over the `mix` value from current params
- **replaceInsert**: Now throws on missing ID instead of silently appending; also disconnects `old.input` in addition to `old.output`

1145/1145 tests pass, TypeScript and ESLint clean.

FIXES_APPLIED
