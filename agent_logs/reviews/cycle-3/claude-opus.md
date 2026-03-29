Types clean, tests pass. The changes are clean and correct:

- **Track delete button now requires double-click** (`e.detail < 2` guard) -- addresses the P2 accidental deletion concern.
- **Bridge ref moved from `InstrumentPanel` to `TrackAudioBridgeProvider`** -- drums now play regardless of which bottom panel is visible. This is a correctness improvement beyond the original review scope but is sound: the bridge lifecycle is tied to the provider, not the UI panel.

REVIEW_APPROVED
