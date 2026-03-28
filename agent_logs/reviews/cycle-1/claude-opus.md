REVIEW_CHANGES_REQUESTED

1. **P1 — `cleanup()` in `clip-scheduler.ts:122-133` is broken.** The method claims to clean up only ended clips, but `gainNode.disconnect()` never throws whether the source is playing or not. The try/catch is a no-op. In practice, calling `cleanup()` disconnects and removes ALL entries including actively playing clips, silencing audio mid-playback. The logic needs an actual "is this source done?" check (e.g., track playback state or check against `ctx.currentTime`).

2. **P1 — `setSolo()` in `mixer-engine.ts:162-166` doesn't update audio routing.** `setMute()` calls `applyMuteState()` immediately, but `setSolo()` does not. This asymmetry means calling `setSolo("track-1", true)` has no audible effect until someone separately calls `updateSoloState()`. Either `setSolo` should call `updateSoloState()` internally (like `setMute` calls `applyMuteState`), or the inconsistency should be documented as intentional with a rationale.

3. **P2 — `MixerPanel.tsx:34-48` — Callbacks with `tracks` in dependency arrays.** `handleMuteToggle` and `handleSoloToggle` include `tracks` (the full array) in their `useCallback` deps. Since the array reference changes on every mutation, these callbacks recreate on every track update, causing all `ChannelStrip` children to re-render. Fix: read from `useDawStore.getState()` inside the callback body instead of closing over the `tracks` selector.

4. **P2 — `clip-scheduler.ts` uses `ClipModel.startTime` as AudioContext time.** `ClipModel.startTime` is typed/documented as "seconds on timeline" (`types.ts:24`), but the scheduler passes it directly to `source.start(clip.startTime, ...)` and `gainNode.gain.setValueAtTime(0, clip.startTime)`, both of which require AudioContext-relative time. If the caller doesn't pre-convert, fades and playback will be scheduled at the wrong time. Either: (a) accept a pre-converted type distinct from `ClipModel`, or (b) accept a time offset parameter and do the conversion inside the scheduler.

5. **P3 — `volumeToDb` duplicated.** Identical function in `ChannelStrip.tsx:30` and `MasterStrip.tsx:19`. Extract to a shared utility.
