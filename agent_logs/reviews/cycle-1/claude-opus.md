Clean type-check. Now my full review:

REVIEW_CHANGES_REQUESTED

1. **P2 - ReDoS risk in track name regex** (`src/ui/transport/TransportBar.tsx:65`): `namePrefix` is interpolated directly into `new RegExp(...)` without escaping. The current preset values ("Audio", "Synth", "808") are safe, but "808" contains no special chars only by luck. If a preset name ever contains regex metacharacters (e.g. `C++`, `(Aux)`), this will break or cause unexpected behavior. Escape `namePrefix` before interpolation, or use a simpler `startsWith` + `parseInt` approach.

2. **P2 - Module-level Map caches never shrink** (`src/ui/panels.tsx:20-24`): `sequencerCache` and `paramsCache` are module-level `Map`s keyed by trackId. When a track is deleted, its entries are never removed. Over a long session with many track create/delete cycles, these accumulate orphaned `StepSequencer` instances and param objects. Add cleanup when tracks are removed (e.g., subscribe to store changes, or clear entries in a `useEffect` cleanup).

3. **P3 - `act()` warnings in test** (`src/ui/track-creation.test.tsx`): The "preserves drum params" test triggers React `act()` warnings on stderr from `useDawStore.setState` inside `rerender`. Wrap the state updates in `act(() => { ... })` to silence the warnings and ensure React processes state correctly during assertions.

4. **P3 - EffectsBridge sync runs on every store change** (`src/audio/effects/effects-bridge.ts:110`): `useEffectsStore.subscribe(sync)` fires `sync()` on every state mutation (any slice), not just `trackEffects` changes. If other effects-store slices are added later, every unrelated write will trigger a full reconciliation loop. Consider using `subscribe` with a selector or `subscribeWithSelector` middleware.

5. **P3 - Sidechain filter is O(n) per track row** (`src/ui/mixer/RoutingMatrix.tsx:117-119`): `sidechains.filter(...)` runs for every track on every render. With many tracks and sidechains this is quadratic. Fine for now, but if the matrix grows, pre-index sidechains by sourceId/targetId in a `useMemo`.
