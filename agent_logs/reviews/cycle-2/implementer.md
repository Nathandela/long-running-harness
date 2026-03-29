Commit succeeded (lint + format checks passed).

FIXES_APPLIED

**Summary of changes:**

- **P1 fix** (`panels.tsx:276`): Replaced `tracks.find(t => selectedTrackIds.includes(t.id))` with a scoped selector using `selectedTrackIds[0]`. This ensures `InstrumentPanel` resolves the same track as `DawShell` under multi-select, where selection order can differ from track-array order.

- **Regression test** (`DawShell-bottom-panel.test.tsx`): Added "multi-select uses selection order, not track array order" test — sets up tracks in `[audio, instrument, drum]` order but selects `[drum, instrument]`, verifying that both `DawShell` and `InstrumentPanel` agree on the drum track being primary.

All 480 UI tests pass. TypeScript compiles cleanly.
