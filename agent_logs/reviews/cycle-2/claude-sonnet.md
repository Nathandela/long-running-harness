All five original findings are addressed:

- **P1 (scheduler dead code)**: Wired via `onAdvance` callback in `look-ahead-scheduler.ts`, created and owned in `use-transport.ts` with `cancelAll` on pause/stop.
- **P1 (duplicate targets)**: `targetsEqual` covers all three discriminants, `addLane` guards with it.
- **P2 (stale params)**: `scheduledParams` rebuilt per window; `cancelAll` has try/catch.
- **P2 (cancelAndHoldAtTime)**: Optional method on `ResolvedParam.param` with fallback to `cancelScheduledValues`.
- **P2/P3 (clamping, zero-length window, test exports)**: All cleanly resolved.

The new `findPointsInRange` binary search is correct (exclusive start, exclusive end), and `timeOffset` is computed correctly for arrangement→AudioContext conversion.

REVIEW_APPROVED
