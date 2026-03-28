All passing. 1118 tests green, 0 type errors, 0 lint errors.

FIXES_APPLIED

**Summary of fixes:**

| Finding | Source | Fix |
|---------|--------|-----|
| **P1** removeBus leaves sends sourced from the bus | Codex | Added cleanup of `sends.get(id)` in both engine (`routing.ts:160-167`) and store (`routing-store.ts:53` filter) |
| **P1** preFader flag is decorative | Sonnet | Added `preFaderTap` GainNode to `ChannelStrip` (`types.ts:20`), wired between insert chain and fader in `mixer-engine.ts` |
| **P1** RoutingEngine never instantiated | Sonnet | Created `routing-bridge.ts` (store-to-engine sync with pre/post-fader wiring) and `RoutingBridgeProvider.tsx`, wired into `DawShell.tsx` |
