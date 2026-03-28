Committed. All checks passed (ESLint, TypeScript, Prettier, pre-commit hooks).

**Summary of what was fixed:**

- **Codex P1 (stale queued rollback)**: Added `catch` block in the save IIFE that clears `queued = null` before rethrowing. This prevents a stale queued snapshot from being persisted after a later successful save rolls the state backward.
- **Regression test**: New test forces a write failure with a queued follow-up, then verifies a subsequent successful save isn't overwritten by the stale value.

All other findings from Claude Sonnet, Claude Opus, and Gemini were already fixed in the prior commit. 385/385 tests pass, TypeScript clean, ESLint clean.

FIXES_APPLIED
