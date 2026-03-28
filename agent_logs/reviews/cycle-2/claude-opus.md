All three findings addressed correctly:

1. **P1 Allpass topology** -- Fixed. Feedforward now comes from the sum node (`v[n]`), not raw input. Transfer function verified as true allpass (`|H|=1` at all frequencies). Also added explicit `BiquadFilterNode` lowpass dampers in comb feedback loops and uses `ctx.sampleRate` instead of hardcoded 44100.

2. **P2 Width parameter** -- Removed from param schema, tests, and shared test suite. No dead code remains.

3. **P3 insert-chain disconnect** -- `replaceInsert` now disconnects both `old.input` and `old.output`, and throws on unknown ID instead of silently appending.

Additional improvements in the fix commits: mix level preserved during A/B swap, `exactOptionalPropertyTypes` compliance in `EffectPanel` props. All 91 tests pass, TypeScript compiles clean.

REVIEW_APPROVED
