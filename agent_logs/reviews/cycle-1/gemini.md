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
