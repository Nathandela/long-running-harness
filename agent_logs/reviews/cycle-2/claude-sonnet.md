REVIEW_CHANGES_REQUESTED

**1. P1 — `importingRef.current` never reset on exception; permanently locks import UI**
`MediaPoolPanel.tsx:111-134`: `importingRef.current = true` is set with no `finally` block. If `pool.importFile` or `pool.getPeaks` throws (e.g. IDB error on `putMeta`/`putPeaks` in `media-pool-manager.ts:46-56`, which is unguarded), `importingRef.current` stays `true` forever and the import button and drag-drop both silently do nothing. Wrap the body in `try { ... } finally { importingRef.current = false; }`.

**2. P2 — Partial write atomicity still unaddressed in `importFile`**
`media-pool-manager.ts:36-56`: `putBlob` is now guarded for `QuotaExceededError`, but `putMeta` (line 46) and `putPeaks` (line 54) are unguarded. If either throws, a blob with no metadata is left orphaned in IDB permanently (since `init()` loads from meta only, the blob is invisible but consuming quota). The same exception also triggers finding #1. Fix: roll back by deleting the blob if `putMeta`/`putPeaks` fail, or move `sources.set`/`bufferCache.set` after all three writes and document the orphan risk.

**3. P3 — App.tsx still shows `ClickToStart` during pool init**
`App.tsx:81-82`: `engine === null || pool === null` renders the start screen while IDB initializes, which typically takes < 50ms but is perceptible. Not a regression from last review — still open.
