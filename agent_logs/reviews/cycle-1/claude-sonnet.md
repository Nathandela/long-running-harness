REVIEW_CHANGES_REQUESTED

---

**1. P2 — `addDrumTrack` caches rejected synthesis promise permanently**

`src/audio/track-audio-bridge.ts:127`

```ts
void getOrSynthesize808Samples(ctx).then((samples) => { ... });
```

No `.catch()`. If `synthesize808Samples` rejects (e.g., `OfflineAudioContext` unavailable, OOM), `sampleCachePromise` permanently holds the rejected promise — every subsequent drum track silently never gets a kit. The drum machine UI renders but produces no audio, with no error surfaced.

Fix: add `.catch((err) => { console.error('808 synthesis failed:', err); sampleCachePromise = null; })` so failures reset the cache and are visible.

---

**2. P2 — `renderOffline` fallback path ties AudioBuffer to a specific `AudioContext`**

`src/audio/drum-machine/drum-synthesis.ts:24`

```ts
const out = targetCtx.createBuffer(1, length, SAMPLE_RATE);
```

When `targetCtx.sampleRate !== 44100` (macOS defaults to 48000 Hz in some configs), the synthesized buffers are created via `targetCtx.createBuffer()`. These are stored in the module-level `sampleCachePromise`. If the engine's `AudioContext` is ever recreated, the new `getOrSynthesize808Samples(newCtx)` call returns the cached buffers from the closed context.

Note: 44100 Hz contexts return the `OfflineAudioContext`-produced buffer (context-independent) — this path is safe. Only the `sampleRate !== 44100` branch is affected.

Also the comment "Copy to target context's sample rate" is wrong — the output buffer's sample rate is still `SAMPLE_RATE` (44100), not `targetCtx.sampleRate`. SRC happens at playback.

---

**3. P3 — `bridgeRef` module singleton races during React StrictMode remount**

`src/ui/panels.tsx:62-67`, `src/ui/panels.tsx:337-341`

StrictMode's intentional double-mount runs: `setBridgeRef(bridge)` → `setBridgeRef(null)` (cleanup) → `setBridgeRef(bridge)`. Any `setInterval` drum trigger that fires during the null window silently drops (the guard `if (!bridge) return` swallows it). Not a production issue but breaks expected behavior in development.

Longer term, a module-level singleton for a React-lifecycle-managed value is fragile; prefer a context or ref passed to sequencer callbacks.

---

**4. P3 — `ArrangementPanel` playback RAF loop uses stale closure values**

`src/ui/arrangement/ArrangementPanel.tsx:224-252`

The inline `tick` function in the playback RAF branch directly captures `view`, `tracks`, `clips`, `selectedClipIds`, `bpm`, `automationLanes`, `clipPeaks` from the outer closure (stale after mount). This is correct by design — when those change, `render` (a dep) changes, restarting the effect with fresh values. But the `eslint-disable` comment only says "deps trigger effect restart" without explaining the mechanism. If someone later adds state to the tick that isn't a dep of `render`, it'll silently use stale values. The pattern should be documented more explicitly.
