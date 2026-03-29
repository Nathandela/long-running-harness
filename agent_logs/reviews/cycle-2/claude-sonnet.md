All three findings from my previous review are addressed:

1. **Orphaned `.mixer` CSS class** — removed.
2. **Missing `afterEach` cleanup** — `afterEach(() => bridge.dispose())` added.
3. **Initial sync path untested** — new `"syncs pre-existing effects on creation"` test added.

The fix commit also addressed additional issues from other reviewers (ReDoS, cache leaks, deleted-track guard, `mockGainNode.connect` correctness). The deleted-track guard in `MixerPanel.tsx` (`tracks.some((t) => t.id === selectedFxTrackId)`) correctly handles the edge case where a track is deleted while its FX rack is open.

REVIEW_APPROVED
