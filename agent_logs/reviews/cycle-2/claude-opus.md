All 797 tests pass. Let me verify all three findings are resolved:

**Finding 1 (P2) — voice-allocator pre-allocation**: Fixed. `completedSteals.length` mutation replaced with a pre-allocated `StealResult` object (`{data, count}`). The array stays at fixed size `MAX_VOICES`. The caller in synth-processor.ts:370 now iterates `completed.count` and reads `completed.data[ci]`. Zero-allocation preserved.

**Finding 2 (P3) — dead `onSetFlam` prop**: Fixed. Prop removed from `DrumMachinePanelProps` and tests.

**Finding 3 (P3) — `disconnectFromMixer` ignoring args**: Fixed. Now calls `mixer.getOrCreateStrip(trackId)` and disconnects specifically from `strip.inputGain`.

Additionally, the fixes include bonus improvements beyond what I flagged:
- OH flam voice tracking (`activeOHFlam`) so CH cuts both primary and flam OH voices
- `peakGain` clamped to `Math.max(0.001, ...)` preventing `exponentialRampToValueAtTime` from receiving zero (which would throw)
- Stale OH reference cleanup in the `ended` listener
- `PARAM_RANGES` used in UI knobs instead of hardcoded min/max values

REVIEW_APPROVED
