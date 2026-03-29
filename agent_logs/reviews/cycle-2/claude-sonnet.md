REVIEW_CHANGES_REQUESTED

All 4 original findings are properly resolved. One new issue introduced by the fix:

---

**1. P2 — Drum scheduler restarts on every track property change, causing double-scheduled hits**

`src/audio/TrackAudioBridgeProvider.tsx:271-277`

```ts
state.tracks !== prev.tracks
```

`state.tracks` is a new array reference on ANY track mutation (volume, pan, mute, solo, name, arm, etc.). When the user moves a fader during playback, this fires, calling `startScheduling()` which clears the interval and re-initializes from the current cursor position. The new interval then re-schedules steps that are already in the WebAudio queue (within the 100ms look-ahead window), producing duplicate drum hits.

`scheduleStep` has no deduplication — it calls `onTrigger` directly for every active step (confirmed at `step-sequencer.ts:76-83`).

Fix: restrict the restart condition to structural track changes only:

```ts
state.transportState !== prev.transportState ||
state.bpm !== prev.bpm ||
state.tracks.length !== prev.tracks.length ||
state.tracks.some((t, i) => t.id !== (prev.tracks[i]?.id))
```

This avoids restarting when track properties (volume/pan/mute/solo) change while preserving restart on track add/remove.
