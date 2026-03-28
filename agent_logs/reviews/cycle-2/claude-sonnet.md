All five findings resolved:

- **P0**: `TransportProvider` wraps `DawShellInner`, providing a single `useTransportInit()` instance via context. `useTransport()` is now a context consumer — no more double instantiation.
- **P1**: `look-ahead-scheduler.ts::advance()` now calls `clock.updateCursor()` on every tick, driving continuous SAB writes during playback.
- **P2 (shortcuts churn)**: `stateRef` pattern eliminates `transportState` from `useEffect` deps.
- **P2 (getter side-effect)**: `getCursorSeconds()` is a pure read; `updateCursor()` owns SAB writes and loop-wrap state.
- **P3**: `secondsToSamples` uses `Math.round`.

Bonus fixes also landed: `seek()` clamps negatives to 0, oscillator nodes self-disconnect via `onended`, `dispose()` fades out gracefully, `beatsPerBar` read dynamically per tick, and `syncToPosition()` provides phase-correct beat alignment on play/resume.

REVIEW_APPROVED
