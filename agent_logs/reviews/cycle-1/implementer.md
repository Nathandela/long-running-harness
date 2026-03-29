Committed. All lint, format, type-check, and tests pass (1562/1562).

**Fixes applied:**

| Finding | Severity | Fix |
|---------|----------|-----|
| `useDawStore(s => s.tracks)` re-renders on every mutation | P1 | Scoped selector returning `boolean` primitive |
| `showMediaPoolOverride` not reset on track change | P2 | Derived-state pattern: `mediaPoolOverrideTrackId === selectedTrackId` |
| Test doesn't cover stale-override | P2 | New test: toggle override, switch tracks, verify reset |
| Layout jitter (240px vs 200px) | P2 | Fixed `height: 240` on instrument/drum wrapper |
| O(n*m) lookup with `.includes()` | P3 | Direct `t.id === id` comparison using `selectedTrackIds[0]` |
| Inline style duplication | P3 | Extracted `panelBtnBase` shared style object |

FIXES_APPLIED
