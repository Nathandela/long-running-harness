You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

All 4 original findings are properly resolved. One new issue introduced by the fix:

---

**1. P2 — Drum scheduler restarts on every track property change, causing double-scheduled hits**

`src/audio/TrackAudioBridgeProvider.tsx:271-277`

```ts
state.tracks !== prev.tracks
```

`state.tracks` is a new array reference on ANY track mutation (volume, pan, mute, solo, name, arm, etc.). When the user moves a fader during playback, this fires, calling `startScheduling()` which clears the interval and re-initializes from the current cursor position. The new interval then re-schedules steps that are already in the WebAudio queue (within the 100ms look-ahead window), producing duplicate drum hits.

`scheduleStep` has no deduplication — it calls `onTrigger` directly for every active step (confirmed at `step-sequencer.ts:76-83`).

Fix: restrict the restart condition to structural track changes only:

```ts
state.transportState !== prev.transportState ||
state.bpm !== prev.bpm ||
state.tracks.length !== prev.tracks.length ||
state.tracks.some((t, i) => t.id !== (prev.tracks[i]?.id))
```

This avoids restarting when track properties (volume/pan/mute/solo) change while preserving restart on track add/remove.
</claude-sonnet-review>

<claude-opus-review>
All tests pass. Let me verify the fix status for each of my original findings:

**Finding 1 (P2) - `sampleCachePromise` ignores AudioContext**: Fixed. `synthesize808Samples()` and `renderOffline()` no longer take an `AudioContext` parameter. Samples are rendered in a standalone `OfflineAudioContext` at 44100 Hz, making them context-independent. Comment documents this. Also added `.catch()` to reset cache on failure.

**Finding 2 (P2) - `renderOffline` dead branch**: Fixed. The `targetCtx` parameter and the broken sample-rate-copy branch are removed entirely.

**Finding 3 (P2) - Module-level `bridgeRef` singleton**: Addressed. Extracted to `sequencer-cache.ts` which centralizes cache and bridge management. The singleton pattern remains (acceptable for this DAW architecture with a single instrument panel).

**Finding 4 (P3) - Mixer forwarding skips new tracks**: Fixed. Changed from `if (!prev) continue;` to `if (!prev || track.volume !== prev.volume)` pattern, so new tracks get their initial values forwarded.

**Finding 5 (P3) - Double `removeStrip` for audio tracks**: Fixed. `addAudioTrack` cleanup no longer calls `removeStrip`; comment clarifies that `handleTrackRemoved` handles it for all track types.

**Finding 6 (P3) - `useTransportCursor` RAF when stopped**: Not addressed, which is acceptable for a P3.

The new drum scheduling service in `TrackAudioBridgeProvider` (lines 188-284) is well-structured: survives track deselection, re-evaluates on transport/BPM/track changes, properly cleans up intervals.

REVIEW_APPROVED
</claude-opus-review>

<gemini-review>
YOLO mode is enabled. All tool calls will be automatically approved.
YOLO mode is enabled. All tool calls will be automatically approved.
[ERROR] [IDEConnectionUtils] IDE fetch failed for http://127.0.0.1:53978/mcp TypeError: fetch failed
    at Object.processResponse (/usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:237:16)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:1081:19
    at node:internal/process/task_queues:151:7
    at AsyncResource.runInAsyncScope (node:async_hooks:214:14)
    at AsyncResource.runMicrotask (node:internal/process/task_queues:148:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/index.js:157:7
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/ide/ide-connection-utils.js:233:30
    at async StreamableHTTPClientTransport.send (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js:306:30) {
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:53978
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1636:16) {
    errno: -61,
    code: 'ECONNREFUSED',
    syscall: 'connect',
    address: '127.0.0.1',
    port: 53978
  }
}
[ERROR] [IDEConnectionUtils] IDE fetch failed for http://127.0.0.1:53978/mcp TypeError: fetch failed
    at Object.processResponse (/usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:237:16)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:1081:19
    at node:internal/process/task_queues:151:7
    at AsyncResource.runInAsyncScope (node:async_hooks:214:14)
    at AsyncResource.runMicrotask (node:internal/process/task_queues:148:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/index.js:157:7
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/ide/ide-connection-utils.js:233:30
    at async StreamableHTTPClientTransport.send (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js:306:30) {
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:53978
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1636:16) {
    errno: -61,
    code: 'ECONNREFUSED',
    syscall: 'connect',
    address: '127.0.0.1',
    port: 53978
  }
}
[ERROR] [IDEClient] Failed to connect to IDE companion extension in IDE. Please ensure the extension is running. To install the extension, run /ide install.
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

- **[P1] Drum playback still depends on opening the drum UI at least once** ([TrackAudioBridgeProvider.tsx:222](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:222), [TrackAudioBridgeProvider.tsx:223](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:223), [panels.tsx:44](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:44), [sequencer-cache.ts:29](/Users/Nathan/Documents/Code/long-running-harness/src/audio/drum-machine/sequencer-cache.ts:29))  
  Moving scheduling into `TrackAudioBridgeProvider` fixed the “selected panel owns playback” problem only partially. The provider still skips any drum track whose sequencer is missing from `sequencerCache`, and that cache is still populated lazily by `getOrCreateSequencer(trackId)` inside `useDrumMachineState()` when the drum panel mounts. So a loaded drum track that has never been opened in the UI will still stay silent until the user selects it once. Initialize sequencers for drum tracks in the audio bridge/provider layer instead of relying on UI mount, and add a regression test for “loaded drum track plays without opening its panel.”</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
