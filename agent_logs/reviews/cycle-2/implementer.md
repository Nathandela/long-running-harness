All 1531 tests pass. Commit successful.

**Fixes applied:**

1. **P1 (Codex)** - Replaced `sequencerCache.get(track.id)` with `getOrCreateSequencer(track.id)` so drum tracks initialize their sequencer eagerly when scheduling starts, not lazily when the UI panel mounts.

2. **P2 (Sonnet)** - Changed the store subscription condition from `state.tracks !== prev.tracks` (triggers on any property change) to `state.tracks.length !== prev.tracks.length || state.tracks.some((t, i) => t.id !== prev.tracks[i]?.id)` (triggers only on structural changes: add/remove/reorder). This prevents double-scheduled drum hits when adjusting faders during playback.

FIXES_APPLIED
