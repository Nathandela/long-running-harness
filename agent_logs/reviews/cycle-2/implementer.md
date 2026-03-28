Committed. All 986 tests pass, TypeScript compiles clean, lint passes.

**Fix applied:**
- **P1 left-edge resize right-edge drift** (`use-piano-roll-interactions.ts:302-306`): Compute `origEnd = origStartTime + origDuration` once, clamp `newStartTime` to `origEnd - 0.01` max, then derive `newDuration = origEnd - newStartTime`. This keeps the right edge pinned at the original position regardless of drag distance.
- Added regression test that drags the left edge 200px past the note end and asserts the right edge stays at `1.0`.

FIXES_APPLIED
