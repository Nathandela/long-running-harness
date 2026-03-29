REVIEW_CHANGES_REQUESTED

1. **P1 — Buffer cache never evicts** (`TrackAudioBridgeProvider.tsx:44`): `bufferCacheRef` grows unboundedly. When clips are deleted from the store, their `AudioBuffer` entries remain cached. For projects with many clip add/remove cycles, this leaks potentially large audio buffers. Fix: subscribe to clip removals and evict stale `sourceId` entries, or use a WeakRef-based cache.

2. **P1 — `onAdvanceCallback` not cleared on unmount** (`TrackAudioBridgeProvider.tsx:69-111`): The effect calls `transport.setOnAdvanceCallback(cb)` but has no cleanup return. On unmount, the transport retains a stale closure that references the disposed `clipScheduler` and `bufferCacheRef`. If transport fires after unmount (hot reload, StrictMode remount delay), it will call `scheduleClips` on a dead scheduler. Fix: add `return () => transport.setOnAdvanceCallback(null);` to the effect.

3. **P2 — Unnecessary double cast** (`TrackAudioBridgeProvider.tsx:106`): `strip.inputGain as unknown as AudioNode` — `GainNode` already extends `AudioNode`, so `strip.inputGain` is directly assignable. The `as unknown` intermediate defeats type safety. Fix: remove the cast entirely.

4. **P2 — Duplicate concurrent fetches for same sourceId** (`TrackAudioBridgeProvider.tsx:48-55`): The store subscription fires `pool.getAudioBuffer(sourceId)` for every clip not yet in cache. Because the check is synchronous (`has()`) but the fetch is async, rapid store updates can trigger multiple concurrent fetches for the same `sourceId` before the first resolves. Fix: track in-flight `sourceId`s in a `Set<string>` alongside the cache.

5. **P2 — Inline callbacks in render body** (`panels.tsx:238-252`): `onNoteOn` and `onNoteOff` are created as new arrow functions on every render of `InstrumentPanel`, not memoized with `useCallback`. Each render passes new references to `SynthEditor`, causing unnecessary child re-renders. Fix: extract into `useCallback` with `[instrument]` dependency, or hoist the instrument lookup + callbacks into a child component.

6. **P3 — Audio tracks have no cleanup entry** (`track-audio-bridge.ts:130-133`): `addAudioTrack` registers in `alive` and creates a mixer strip, but does not add an entry to `trackCleanups`. While `handleTrackRemoved` still calls `mixer.removeStrip`, the asymmetry with instrument/drum tracks is surprising and makes future refactoring error-prone. Consider adding an empty cleanup for consistency.
