REVIEW_CHANGES_REQUESTED

1. **P2 — `showMediaPoolOverride` not reset on track selection change.** When a user toggles to media pool view on an instrument track, then selects an audio track (side-by-side mode), then selects another instrument track, `showMediaPoolOverride` remains `true` — they see the media pool instead of the instrument panel. Add an effect to reset it:
   ```tsx
   useEffect(() => { setShowMediaPoolOverride(false); }, [isInstrumentOrDrum]);
   ```
   The existing test "resets to instrument view when switching from audio to instrument track" doesn't cover this because it never toggles `showMediaPoolOverride` before switching tracks.

2. **P3 — `selectedTrack` picks first match with multi-select.** `tracks.find((t) => selectedTrackIds.includes(t.id))` silently takes the first match in `tracks` array order when multiple tracks are selected. If the user selects both an audio and an instrument track, the layout depends on which appears first in the tracks array. Consider using the *last* selected track ID (`selectedTrackIds.at(-1)`) for more predictable behavior, or document the current heuristic.

3. **P3 — Inline style duplication.** The close button and toggle button share nearly identical absolute-positioned button styling (position, top, right, zIndex, cursor, fontFamily). Consider extracting a shared style object to avoid drift between the two.
