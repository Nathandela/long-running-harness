All clean. The pre-existing warnings are from other files, not from this change.

**Summary of fixes:**

- **Codex P2 (cache leak on same-size track replacement)**: Removed the `trackIds.size < prevTrackIds.size` guard in `src/ui/panels.tsx:30`. The subscription now diffs track IDs on every update, purging cache entries for any removed track regardless of array size changes.
- **Regression test**: Added `src/ui/panels-cache.test.ts` with two cases — same-size full replacement and partial replacement — confirming stale entries are purged correctly.

All 1490 tests pass. Type check clean. Lint clean.

FIXES_APPLIED
