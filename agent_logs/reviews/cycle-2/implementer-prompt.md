You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All 7 findings have been addressed:

- **P1 cleanup()**: Fixed — now checks `entry.endTime <= ctx.currentTime` before disconnecting; only removes entries that have finished.
- **P1 time coordinates**: Fixed — `timeOffset` parameter added; uses `clipStartCtx = clip.startTime + timeOffset`; overlap check replaces exact-start match; mid-clip seek computes correct `sourceOffset` and partial fade-in gain.
- **P2 setSolo two-step**: Fixed — `setSolo()` and `setSoloIsolate()` now call `updateSoloState()` internally.
- **P2 fade overlap**: Fixed — `maxFadeIn`/`maxFadeOut` clamped so they can't sum past `clip.duration`.
- **P2 MixerEngine not wired**: Acknowledged as intentional deferred work; the existing MixerPanel comment already documents this; out of scope for this epic.
- **P3 misnamed taper**: Renamed to `faderTaper`, comment updated.
- **P3 dead code comment**: E13 intent comment added to the index export.

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All 60 tests pass (up from 57 — 3 new tests added for the clip scheduler fixes). Let me verify each original finding:

| # | Finding | Status |
|---|---------|--------|
| 1 | P1: `cleanup()` broken — disconnected all entries | Fixed: now checks `entry.endTime <= ctx.currentTime` |
| 2 | P1: `setSolo()` didn't update routing | Fixed: now calls `engine.updateSoloState()` internally; tests updated to remove manual calls |
| 3 | P2: `tracks` in callback deps | Fixed: uses `useDawStore.getState().tracks.find(...)` inside callback |
| 4 | P2: `clip.startTime` time model mismatch | Fixed: added `timeOffset` param with clear doc; handles mid-clip seeking and fade clamping |
| 5 | P3: duplicated `volumeToDb` | Fixed: extracted to `format.ts`, imported in both components |

Bonus improvements in the fix: `ScheduledClip` now tracks `endTime`, `ended` event handler guards against stale entries, fades are clamped to prevent overlap, and `logarithmicTaper` was renamed to `faderTaper` (more accurate — it's quadratic, not logarithmic).

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

6. **[P2] Mixer Engine is Not Hooked Up**: `createMixerEngine` is implemented and its types are exported, but it is never instantiated or integrated into `DawStore` or `AudioEngineProvider`. The mixer panel UI updates the Zustand store successfully, but it does not drive the actual audio graph. This finding from the initial review remains unaddressed.
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] Seeking into the fade-out portion of a clip still applies the wrong gain envelope** ([clip-scheduler.ts:107](/Users/Nathan/Documents/Code/long-running-harness/src/audio/mixer/clip-scheduler.ts:107), [clip-scheduler.ts:118](/Users/Nathan/Documents/Code/long-running-harness/src/audio/mixer/clip-scheduler.ts:118), [clip-scheduler.test.ts:144](/Users/Nathan/Documents/Code/long-running-harness/src/audio/mixer/clip-scheduler.test.ts:144))  
  The new mid-clip seek logic adjusts `sourceOffset`, but the fade-out automation is still scheduled as if playback began at the clip start. When playback starts after `fadeOutStartCtx`, `setValueAtTime(clip.gain, fadeOutStartCtx)` is in the past, so the clip resumes at full gain instead of the already-faded level and ramps down from there. That creates an audible jump when seeking into the tail fade. The tests cover mid-clip seeking and time offsets, but not seeking into an active fade-out region. Compute the starting fade-out gain from `seekOffset` the same way the fade-in path already does, and add a regression test for seeking into a clip whose fade-out is already in progress.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
