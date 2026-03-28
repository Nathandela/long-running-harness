The P3 ClickToStart issue is still open. The P1 (`importingRef` without `finally`) and P2 (blob orphan rollback) are both fixed. The P3 was flagged in the previous two cycles and hasn't been addressed.

REVIEW_CHANGES_REQUESTED

**1. P3 — App.tsx still shows `ClickToStart` during pool init (third cycle)**
`App.tsx:81`: `engine === null || pool === null` renders the start screen while IDB initializes after the user clicks start. This has been carried over from the previous two review cycles without a fix. Render `DawShell` as soon as `engine` is set (pool is always fast to init, and `DawShell` can tolerate receiving an empty pool), or show a distinct loading state rather than re-showing the start screen.
