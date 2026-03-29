REVIEW_CHANGES_REQUESTED

**1. P2 — `showMediaPoolOverride` not reset on track change** (`DawShell.tsx:48`)

`showMediaPoolOverride` is never reset when the selected track changes. If a user toggles to media pool view for an instrument track, switches to an audio track (side-by-side layout), then switches back to an instrument track, `showMediaPoolOverride` is still `true` — the instrument panel never appears. A `useEffect` keyed on `selectedTrack?.id` should reset it to `false`.

**2. P2 — Test doesn't cover the stale-override scenario** (`DawShell-bottom-panel.test.tsx:208`)

The test named "resets to instrument view when switching from audio to instrument track" passes only because `showMediaPoolOverride` was never toggled to `true` before the track switch. It doesn't verify actual reset behavior. A test should click the toggle button first, then switch tracks, and assert InstrumentPanel is shown.

**3. P3 — `selectedTrack` uses `Array.find` over all tracks for each render** (`DawShell.tsx:53`)

`tracks.find((t) => selectedTrackIds.includes(t.id))` does an O(n×m) scan on every render. With many tracks this is wasteful; prefer `tracks.find((t) => t.id === selectedTrackIds[0])` or a Map lookup if the selection is expected to be single or primary-track semantics apply here.
