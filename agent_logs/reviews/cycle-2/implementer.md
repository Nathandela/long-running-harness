All 1212 tests pass across 110 test files.

FIXES_APPLIED

**Summary**: Single fix addressing the P1/P2 finding identified by both Codex and Sonnet:

- **`RemoveTrackCommand`** now snapshots `ArpParams` in `execute()` before calling `removeArp()`, and restores them via `setParams()` in `undo()` after `initArp()`. Previously, undo always reset to `DEFAULT_ARP_PARAMS`, losing any custom arp configuration.
- Added regression test confirming non-default arp params (pattern, rate, octave range, gate, swing, latch) survive a remove-then-undo cycle.
