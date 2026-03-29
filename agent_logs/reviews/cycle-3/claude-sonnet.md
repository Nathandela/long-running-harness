All three findings are resolved per the updated `DawShell.tsx`:

- **P2 (stale override)**: Replaced `boolean` flag with `mediaPoolOverrideTrackId: string | undefined`; override is derived as `id !== undefined && id === selectedTrackId`, so it auto-invalidates on any track switch without a `useEffect`.
- **P2 (missing test)**: "resets stale media-pool override when switching tracks" covers the exact scenario — toggle on t1, switch to t2, switch to t3, assert InstrumentPanel shown.
- **P3 (selector efficiency)**: `selectedTrackId` and `isInstrumentOrDrum` are scoped selectors returning primitives.

REVIEW_APPROVED
