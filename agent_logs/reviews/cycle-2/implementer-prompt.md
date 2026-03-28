You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

**1. P1 — `importingRef.current` never reset on exception; permanently locks import UI**
`MediaPoolPanel.tsx:111-134`: `importingRef.current = true` is set with no `finally` block. If `pool.importFile` or `pool.getPeaks` throws (e.g. IDB error on `putMeta`/`putPeaks` in `media-pool-manager.ts:46-56`, which is unguarded), `importingRef.current` stays `true` forever and the import button and drag-drop both silently do nothing. Wrap the body in `try { ... } finally { importingRef.current = false; }`.

**2. P2 — Partial write atomicity still unaddressed in `importFile`**
`media-pool-manager.ts:36-56`: `putBlob` is now guarded for `QuotaExceededError`, but `putMeta` (line 46) and `putPeaks` (line 54) are unguarded. If either throws, a blob with no metadata is left orphaned in IDB permanently (since `init()` loads from meta only, the blob is invisible but consuming quota). The same exception also triggers finding #1. Fix: roll back by deleting the blob if `putMeta`/`putPeaks` fail, or move `sources.set`/`bufferCache.set` after all three writes and document the orphan risk.

**3. P3 — App.tsx still shows `ClickToStart` during pool init**
`App.tsx:81-82`: `engine === null || pool === null` renders the start screen while IDB initializes, which typically takes < 50ms but is perceptible. Not a regression from last review — still open.
</claude-sonnet-review>

<claude-opus-review>
All 318 tests pass, types check clean. Let me verify each prior finding against the fixes:

| Finding | Status |
|---|---|
| **P2-1**: `removeSource` deletes memory before storage | Fixed - storage ops now run first (lines 94-97), then `sources.delete`/`bufferCache.delete` |
| **P2-2**: `StorageFullError` dead code | Fixed - `putBlob` now catches `QuotaExceededError` and returns `storage-full` error (lines 37-45) |
| **P2-4**: No concurrency guard on import | Fixed - `importingRef` gate added (lines 90, 110-111, 133) |
| **P3-1**: Only last error shown in batch | Fixed - `errors` is now an array, all errors accumulated and rendered (lines 89, 113, 126, 129-131, 192-198) |
| **P3-2**: `getAudioBuffer` re-decodes every call | Fixed - `bufferCache` Map added, populated on import and decode (lines 18, 60, 69-70, 77) |
| **P2-3**: `computeWaveformPeaks` blocks main thread | Not addressed (P2) |
| **P3-3**: IDB connection never closed | Not addressed (P3) |

The remaining P2-3 (main-thread blocking waveform computation) is a real concern for large files but is an optimization, not a correctness bug -- and the 500MB gate limits the blast radius. P3-3 is low-impact given the engine lifecycle. The critical correctness and usability fixes are all resolved.

REVIEW_APPROVED
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
1. [P3] Redundant `getPeaks` calls during component mount (Unresolved)
The fix for preventing redundant `getPeaks` calls was not correctly applied. The new `importingRef` prevents concurrent file imports, but the `useEffect` that loads cached peaks on mount remains unchanged. Because `setPeaksMap` is asynchronous and multiple renders can occur while it resolves, checking `if (peaksMap.has(source.id))` is insufficient. A ref (e.g., `loadingPeaksRef: MutableRefObject<Set<string>>`) must be used inside the `useEffect` to track in-flight requests and prevent redundant database reads.
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] Negative seeks still desynchronize the UI store from the transport clock** ([use-transport.ts:136](/Users/Nathan/Documents/Code/long-running-harness/src/audio/use-transport.ts:136), [transport-clock.ts:116](/Users/Nathan/Documents/Code/long-running-harness/src/audio/transport-clock.ts:116))  
  The clock still clamps `seek()` to `0`, but `useTransport.seek()` continues to write the raw `seconds` value into Zustand after calling `clock.seek(seconds)`. So `seek(-5)` leaves the audio clock and SAB at `0` while the UI store shows `-5`. The added `schedulerRef.current?.sync()` fixes beat phase, not this state split. Write the clamped value back to the store, or read back `clock.getCursorSeconds()` after seeking, and add a hook-level regression test for negative seeks.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
