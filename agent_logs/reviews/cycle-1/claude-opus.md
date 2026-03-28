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
