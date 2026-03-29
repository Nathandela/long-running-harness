REVIEW_CHANGES_REQUESTED

---

**1. [P2] Buffer cache grows unboundedly — memory leak**
`TrackAudioBridgeProvider.tsx:44` — `bufferCacheRef` accumulates `AudioBuffer` entries (uncompressed PCM, potentially 10s–100s of MB each) and never evicts them when clips are deleted from the store. The subscribe callback only adds, never removes. In a live session with frequent clip edits this will bloat memory. Fix: subscribe to clip removals and `bufferCacheRef.current.delete(clip.sourceId)` when a sourceId is no longer referenced by any clip.

**2. [P2] `addAudioTrack` never registers a cleanup — mixer strip leaks on `dispose()`**
`track-audio-bridge.ts:130-133` — `addAudioTrack` calls `mixer.getOrCreateStrip` but doesn't add an entry to `trackCleanups`. When `bridge.dispose()` runs, the loop over `trackCleanups.values()` skips audio tracks, so `mixer.removeStrip` is never called for them. They leak until `EffectsBridgeProvider` disposes the whole mixer. Fix: add `trackCleanups.set(trackId, () => mixer.removeStrip(trackId))` in `addAudioTrack`.

**3. [P3] Unnecessary `as unknown as AudioNode` cast**
`TrackAudioBridgeProvider.tsx:106` — `strip.inputGain` is a `GainNode`, which extends `AudioNode`. The double-cast through `unknown` is not needed; `scheduleClips` accepts `AudioNode`. Remove the cast.

**4. [P3] `alive` set carried for drum/audio tracks but never consulted**
`track-audio-bridge.ts:117,131` — `alive.add(trackId)` is called in `addDrumTrack` and `addAudioTrack`, but `alive.has(trackId)` is only checked inside the async instrument creation callback (lines 95). For drum and audio tracks the flag is never read, making the intent opaque. Either document why it's added (e.g. "reserved for future async loading") or remove it from those paths to keep the invariant clear.
