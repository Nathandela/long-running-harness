Committed. All 1488 tests pass, type check clean, lint clean.

FIXES_APPLIED

Here's what was addressed:

**P2 fixes:**
- **ReDoS risk** (`TransportBar.tsx:64-67`): Replaced `new RegExp()` interpolation with `startsWith` + `parseInt` -- safe regardless of preset name characters
- **Module-level Map leak** (`panels.tsx:26-36`): Added `useDawStore.subscribe` to clean up `sequencerCache`/`paramsCache` entries when tracks are deleted
- **Test subscription leak** (`effects-bridge.test.ts`): Added `afterEach(() => bridge.dispose())` to tear down store subscriptions between tests
- **EffectsRack for deleted track** (`MixerPanel.tsx:119-121`): Added `tracks.some()` guard so the rack won't render for a non-existent track

**P3 fixes:**
- **Orphaned `.mixer` CSS class** (`MixerPanel.module.css`): Removed 8 lines of dead code
- **Initial sync path untested** (`effects-bridge.test.ts`): Added test that populates store before creating bridge
- **`act()` warnings** (`track-creation.test.tsx`): Wrapped `setState` calls in `act()`
- **EffectsBridge over-firing** (`effects-bridge.ts:109-115`): Sync now skips unless `trackEffects` reference changed
- **Mock correctness** (`effects-bridge.test.ts:16`): `connect` now returns destination node per Web Audio spec
