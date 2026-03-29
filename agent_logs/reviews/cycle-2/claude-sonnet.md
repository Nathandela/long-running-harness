All three findings are addressed:

- **P2 (stale override)**: Replaced `showMediaPoolOverride: boolean` with `mediaPoolOverrideTrackId: string | undefined` — the override is scoped to a track ID and auto-invalidates on track switch without a `useEffect`.
- **P2 (missing test)**: New test "resets stale media-pool override when switching tracks" covers exactly the scenario: toggle on t1, switch to t2, switch to t3, assert instrument panel shown.
- **P3 (selector efficiency)**: `selectedTrackId` and `isInstrumentOrDrum` now use scoped selectors returning primitives, avoiding full array subscriptions.

REVIEW_APPROVED
