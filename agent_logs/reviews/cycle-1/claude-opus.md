All tests pass. Here's my review:

REVIEW_CHANGES_REQUESTED

1. **P2 — `sampleCachePromise` ignores AudioContext identity** (`src/audio/track-audio-bridge.ts:66-76`). The module-level `sampleCachePromise` caches based on the first `AudioContext` ever passed. If the AudioContext is re-created (e.g., after `close()` due to user gesture policies or hardware changes), stale samples from the old context are returned. Fix: key the cache by `AudioContext` instance (e.g., `WeakMap<AudioContext, Promise<...>>`).

2. **P2 — `renderOffline` sample rate branch is a no-op copy** (`src/audio/drum-machine/drum-synthesis.ts:23-26`). When `targetCtx.sampleRate !== SAMPLE_RATE`, the code creates a new buffer at... the same 44100 Hz sample rate and copies the same data. This doesn't actually resample. The comment "Copy to target context's sample rate" is misleading. WebAudio resamples on playback, so this works by accident. Either remove the dead branch or implement proper resampling with `OfflineAudioContext` at the target rate.

3. **P2 — Module-level `bridgeRef` is fragile singleton** (`src/ui/panels.tsx:63-68`). The `bridgeRef` global is set/cleared by `InstrumentPanel`'s effect. If multiple `InstrumentPanel` instances ever mount (HMR, route transitions), the last to unmount nulls it, silencing all drum triggers. Consider passing the bridge through the sequencer factory or a context instead.

4. **P3 — Mixer forwarding effect skips initial values for new tracks** (`src/audio/TrackAudioBridgeProvider.tsx:166-186`). The `if (!prev) continue;` guard means a newly added track's initial volume/pan/mute/solo are never forwarded to the mixer. Works today because both sides start at defaults, but any future non-default-initialized track would silently desync. Add an initialization path for new tracks.

5. **P3 — Double `removeStrip` call for audio tracks** (`src/audio/track-audio-bridge.ts:145,168`). `addAudioTrack` sets a cleanup that calls `mixer.removeStrip()`, then `handleTrackRemoved` also calls `mixer.removeStrip()`. Safe due to the null guard but asymmetric with instrument/drum tracks. Move `removeStrip` out of the audio track cleanup to match the pattern.

6. **P3 — `useTransportCursor` RAF loop runs even when transport is stopped** (`src/ui/hooks/useTransportCursor.ts:24-31`). The RAF tick runs continuously as long as a `transportSAB` exists, polling every frame even when paused/stopped. In `ArrangementPanel`, a second RAF loop also polls during playback. Consider gating the cursor hook's RAF on transport state, or at minimum, documenting the intentional overlap.
