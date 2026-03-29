You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
`ArrangementPanel.tsx:166` populates `clipPeaks` keyed by `clip.id`, which matches the renderer at line 256. The key change in the test (`"src-1"` → `"c1"`) is correct.

All four findings are resolved:
- **#1 (P2)**: `{valueText ?? String(value)}` — fixed
- **#2 (P2)**: Arrow-key navigation + single-tabstop radiogroup — fixed
- **#3 (P3)**: `console.warn` with error info — fixed
- **#4 (P3)**: Exact 4-bar assertion + clip.id key alignment — fixed

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All three findings are resolved:

1. **P2 (RotaryKnob display)**: Fixed — now shows `{valueText ?? String(value)}`, restoring units.
2. **P3 (ToggleGroup button type)**: Fixed — `type="button"` added.
3. **P3 (Silent catch)**: Fixed — now logs `console.warn("Failed to prefetch buffer:", clip.sourceId, err)`.

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
    at Socket.<anonymous> (node:internal/child_process:456:11)
    at Socket.emit (node:events:518:28)
    at Pipe.<anonymous> (node:net:351:12) {
  code: -32000,
  data: undefined
}
MCP issues detected. Run /mcp list for status.Scheduling MCP context refresh...
Executing MCP context refresh...
MCP context refresh complete.
REVIEW_APPROVED
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] In-flight buffer loads can still repopulate the cache after the last referencing clip was removed** ([TrackAudioBridgeProvider.tsx:50](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:50), [TrackAudioBridgeProvider.tsx:60](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:60), [TrackAudioBridgeProvider.tsx:62](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:62), [TrackAudioBridgeProvider.tsx:74](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:74))  
  The rejection path is handled now, but the success path still caches the resolved buffer without re-checking that the `sourceId` is still active. If the last clip using that source is removed while `getAudioBuffer()` is in flight, the resolve handler puts the buffer back into `bufferCacheRef` after the eviction pass has already run, so the stale entry can sit there until some later clip-state change happens to evict it. The leak fix is still partial. Re-check liveness before caching the resolved buffer, and add a regression test for “clip removed before prefetch resolves.”

- **[P1] The new waveform-peaks dependency broke isolated `DawShell` rendering, and `pnpm test` is red** ([ArrangementPanel.tsx:134](/Users/Nathan/Documents/Code/long-running-harness/src/ui/arrangement/ArrangementPanel.tsx:134), [ArrangementPanel.tsx:135](/Users/Nathan/Documents/Code/long-running-harness/src/ui/arrangement/ArrangementPanel.tsx:135), [DawShell.test.tsx:81](/Users/Nathan/Documents/Code/long-running-harness/src/ui/DawShell.test.tsx:81))  
  `ArrangementPanel` now unconditionally calls `useMediaPool()` and `useAudioEngine()`. In the current branch, `DawShell.test.tsx` still renders `ArrangementPanel` without an audio-engine mock/provider, so `pnpm test` now fails with `useAudioEngine must be used within AudioEngineProvider`. Either mock `@audio/use-audio-engine` in that test path or loosen the panel’s coupling so peak fetching is optional when the provider is absent.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
