All fixes applied and committed. Lint passes, 259 tests pass.

**Summary of fixes:**

| Finding | Severity | Fix |
|---------|----------|-----|
| `useTransportShortcuts` mutates ref during render | P1 | Moved `stateRef.current = transportState` into a `useEffect`, keeping command registration effect stable with no `transportState` dep |
| `metronome.ts` void-return shorthand (`osc.onended`) | P2 | Wrapped arrow body in braces |
| `metronome.ts` void-return shorthand (`setTimeout`) | P2 | Wrapped arrow body in braces |

FIXES_APPLIED
