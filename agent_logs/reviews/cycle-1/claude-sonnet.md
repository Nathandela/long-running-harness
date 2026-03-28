REVIEW_CHANGES_REQUESTED

---

**1. P1 — `getAudioBuffer` has no in-memory cache; will re-decode on every call**
`media-pool-manager.ts:56` reads the blob from IDB and calls `decodeAudioData` every time. `decodeAudioData` is CPU-expensive and must not be called on the hot path. When tracks/clips start consuming this API, every playback event will trigger a full decode. An `AudioBuffer` cache (`Map<string, AudioBuffer>`) needs to be maintained alongside `sources`.

**2. P2 — `importFile` writes are non-atomic; orphaned blobs accumulate on partial failure**
`media-pool-manager.ts:34-46`: `putBlob` → `putMeta` → `putPeaks` are three separate IDB transactions. A crash after `putBlob` but before `putMeta` leaves an invisible orphaned blob that will never be cleaned up (since `init()` only loads from `getMeta`). Same issue for `removeSource` (lines 78-80) in reverse: if `deleteBlob` succeeds but `deleteMeta` fails, dead metadata persists. Either use a blob-key-matches-meta invariant enforced on startup, or document that orphans are tolerated and add a cleanup path.

**3. P2 — `deletePeaksBySource` in IDB issues one transaction per peak key**
`idb-storage.ts:217-225`: sequentially awaits `idbDelete` per key inside a loop. Each is a separate transaction with its own overhead. Should batch all deletes under one transaction using a cursor or `IDBKeyRange`.

**4. P3 — Unsafe cast `as unknown as File[]` in `useFileDrop.ts:46`**
`[...(e.dataTransfer.files as unknown as File[])]` — `FileList` is not `File[]`; the cast hides the type. Use `Array.from(e.dataTransfer.files)` which is typed correctly and handles `null` safely.

**5. P3 — `App.tsx` shows `ClickToStart` during pool init**
Lines 90-92: `engine === null || pool === null` renders `ClickToStart` while IDB is initializing after the user has already clicked start. Any IDB delay causes a confusing re-appearance of the start screen. Pool init should not block render; show a loading state or initialize pool synchronously before first render.

**6. P3 — `WaveformPreview.tsx:32` hardcodes `#0066ff`**
Comment says `/* --color-blue */` but uses the literal hex. If the design token changes the displayed waveform won't follow. Use `var(--color-blue)` with a `fillStyle` computed from a CSS variable or accept the color as a prop.

**7. P3 — `handleImport` silently discards all but the last error in multi-file imports**
`MediaPoolPanel.tsx:118`: `setError(result.error)` inside the `for` loop overwrites each previous error. If files 1 and 2 fail but file 3 succeeds, no error is shown at all. Accumulate errors and display all of them, or stop on first error and report which file failed.
