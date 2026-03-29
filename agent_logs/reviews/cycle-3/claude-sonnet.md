The four original findings are all resolved. The new code introduces new issues:

REVIEW_CHANGES_REQUESTED

---

**1. P2 — `sampleCachePromise` module-level singleton ignores AudioContext identity**

`src/audio/track-audio-bridge.ts:66-75` — `sampleCachePromise` is a module-level variable that is never reset. `getOrSynthesize808Samples(ctx)` ignores the `ctx` argument after the first call. If the `AudioContext` is closed and a new one created (happens in tests; can happen after suspend/reconnect), the cached promise resolves with `AudioBuffer` objects from the old context. Feeding those into a new context's `createBufferSource` violates the Web Audio spec and produces silence or throws. The cache should be keyed on the context or cleared on `dispose()`.

---

**2. P3 — Sequential peak fetching blocks waveform display**

`src/ui/arrangement/ArrangementPanel.tsx:152` — The `fetchPeaks` function uses `await` in a `for...of` loop, serializing every `pool.getPeaks()` call. For a project with N audio clips it waits clip-1 → clip-2 → … → clip-N before showing any waveforms. Use `Promise.all` (or `Promise.allSettled`) over the audio clips to fetch in parallel.

---

**3. P3 — Drum triggers silently drop when InstrumentPanel is not the active panel**

`src/ui/panels.tsx:58-62` — `bridgeRef` is set by `InstrumentPanel`'s `useEffect`. The `getOrCreateSequencer` trigger callback reads this module-level ref at call time. If a drum track is playing and the user switches to viewing a different track type (or no track), `InstrumentPanel` unmounts, `setBridgeRef(null)` runs, and any drum triggers fire with `bridgeRef === null` — silent failure, no error. The bridge should come from a always-rendered provider context rather than a conditionally-mounted component.
