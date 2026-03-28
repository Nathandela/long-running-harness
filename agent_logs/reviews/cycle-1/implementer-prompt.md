You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
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
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

## Findings

**P2-1: `removeSource` deletes from memory before confirming storage deletion** (`media-pool-manager.ts:77`)
If `storage.deleteBlob()` or `storage.deleteMeta()` throws, the source is removed from the in-memory map but persists in IndexedDB. On next `init()`, it reappears as a ghost entry. Move `sources.delete(id)` to after all storage operations succeed.

**P2-2: `StorageFullError` is dead code** (`types.ts:43-46`)
The `storage-full` error kind is defined and handled in `formatError`, but no code path ever produces it. `putBlob` does not catch `QuotaExceededError` from IndexedDB. Either implement quota detection in `idb-storage.ts` or remove the dead type/branch to avoid misleading error handling.

**P2-3: `computeWaveformPeaks` blocks main thread for large files** (`waveform-peaks.ts`)
For a 500MB WAV at 44.1kHz stereo, this iterates ~11.2M samples synchronously. At the 500MB limit this could block the UI for hundreds of milliseconds. Consider yielding to the event loop periodically (e.g., chunked processing with `setTimeout`) or moving to a Web Worker.

**P2-4: No concurrency guard on import** (`MediaPoolPanel.tsx:108-129`)
User can click IMPORT or drop files while a previous import is still in progress. Both flows fire `handleImport` with no mutex or `isImporting` flag, risking interleaved state updates and confusing error display. Add a busy guard or disable the import button during processing.

**P3-1: Only last error shown in batch import** (`MediaPoolPanel.tsx:123`)
When importing multiple files, `setError(result.error)` overwrites any previous error. If 3 of 5 files fail, user only sees the last failure. Consider accumulating errors or showing a count.

**P3-2: `getAudioBuffer` re-decodes on every call** (`media-pool-manager.ts:56-62`)
Each call reads from IDB and calls `decodeAudioData`. For DAW playback this will be called frequently. Consider an LRU cache for decoded AudioBuffers.

**P3-3: IDB connection is never closed** (`idb-storage.ts:172-179`)
The lazy singleton `dbPromise` holds the IDB connection for the lifetime of the page. The `MediaPoolStorage` interface has no `close()` or `dispose()` method, so when `App.tsx` creates a new storage on engine change (line 24), the old connection leaks. Low impact since engine changes at most once, but the pattern is fragile.
</claude-opus-review>

<gemini-review>
YOLO mode is enabled. All tool calls will be automatically approved.
YOLO mode is enabled. All tool calls will be automatically approved.
[MCP error] Error during discovery for MCP server 'playwright': MCP error -32000: Connection closed McpError: MCP error -32000: Connection closed
    at McpError.fromError (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/types.js:2035:16)
    at Client._onclose (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js:259:32)
    at _transport.onclose (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js:223:18)
    at ChildProcess.<anonymous> (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js:85:31)
    at ChildProcess.emit (node:events:518:28)
    at maybeClose (node:internal/child_process:1101:16)
    at ChildProcess._handle.onexit (node:internal/child_process:304:5) {
  code: -32000,
  data: undefined
}
MCP issues detected. Run /mcp list for status.Scheduling MCP context refresh...
Executing MCP context refresh...
MCP context refresh complete.
REVIEW_CHANGES_REQUESTED

1. [P1] Look-ahead scheduler schedules events past the loop end boundary
In `src/audio/look-ahead-scheduler.ts`, the `advance()` loop schedules events up to `scheduleUntil = ctx.currentTime + lookAheadSec` assuming linear time. When approaching the loop end, it will schedule events past `loop.end` into the Web Audio API. When `ctx.currentTime` actually passes the boundary later, `clock.updateCursor()` triggers a wrap and `syncToPosition` resyncs the phase, but the erroneous events have already been scheduled and the wrap-point events (e.g., beat 0) are skipped entirely. The scheduler needs to constrain its `scheduleUntil` window by the loop boundary and wrap its internal `nextBeatTime` during the look-ahead pass.

2. [P1] Seeking during playback desynchronizes the LookAheadScheduler
In `src/audio/use-transport.ts`, the `seek(seconds)` function updates the `clock` cursor but does not notify the `schedulerRef`. Because the scheduler caches `nextBeatTime` and `currentBeat`, it remains completely unaware of the seek and continues ticking at the old phase and beat numbers. The scheduler must be stopped/started or provided a `sync()` method to align to the new cursor position when a seek occurs during playback.

3. [P2] Severe memory and performance overhead in `MediaPool.getAudioBuffer()`
In `src/audio/media-pool/media-pool-manager.ts`, `getAudioBuffer` fetches the file from IndexedDB and calls `ctx.decodeAudioData(arrayBuffer)` on every invocation. For a DAW Media Pool, multiple track items referencing the same source will trigger redundant decodes, causing significant CPU overhead, GC pauses, and memory pressure. The Media Pool should maintain an in-memory cache of active `AudioBuffer`s.

4. [P3] Redundant `getPeaks` calls during component mount
In `src/ui/media-pool/MediaPoolPanel.tsx`, `peaksMap.has(source.id)` is checked synchronously, but `setPeaksMap` happens asynchronously inside `Promise.all`. Concurrent React renders can cause `pool.getPeaks` to be called multiple times for the same source before the state is updated. This should use a ref or an atomic loading state map to prevent redundant DB reads.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
