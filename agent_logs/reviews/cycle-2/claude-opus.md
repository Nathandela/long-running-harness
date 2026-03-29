All six findings addressed. Verification:

| # | Finding | Status |
|---|---------|--------|
| 1 | Buffer cache never evicts | Fixed: `syncBuffers` evicts entries for removed clips |
| 2 | `onAdvanceCallback` not cleared on unmount | Fixed: cleanup returns `transport.setOnAdvanceCallback(null)`, type widened to accept `null` |
| 3 | Unnecessary `as unknown as AudioNode` cast | Fixed: now just `strip.inputGain` |
| 4 | Duplicate concurrent fetches | Fixed: `inFlightRef` Set tracks in-flight sourceIds |
| 5 | Inline callbacks in render body | Fixed: extracted `SynthTrackPanel` with `useMemo`-wrapped callbacks |
| 6 | Audio tracks have no cleanup entry | Fixed: `addAudioTrack` now registers `mixer.removeStrip` in `trackCleanups` |

Bonus: the `alive` Set was replaced with a `trackGeneration` counter map, which correctly handles add-remove-add races for the same trackId.

One minor note: for audio tracks, `removeStrip` is called twice in `handleTrackRemoved` (once from the cleanup, once directly at line 156), but `removeStrip` guards with `if (!strip) return` so the second call is a harmless no-op. Not worth blocking on.

Tests pass, types check clean.

REVIEW_APPROVED
