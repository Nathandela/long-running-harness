You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All three findings are addressed:

- **P2 (stale override)**: Replaced `showMediaPoolOverride: boolean` with `mediaPoolOverrideTrackId: string | undefined` — the override is scoped to a track ID and auto-invalidates on track switch without a `useEffect`.
- **P2 (missing test)**: New test "resets stale media-pool override when switching tracks" covers exactly the scenario: toggle on t1, switch to t2, switch to t3, assert instrument panel shown.
- **P3 (selector efficiency)**: `selectedTrackId` and `isInstrumentOrDrum` now use scoped selectors returning primitives, avoiding full array subscriptions.

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All three findings are addressed:

1. **P2 override reset** — Fixed elegantly by scoping the override to a specific track ID (`mediaPoolOverrideTrackId`). When the selected track changes, `showMediaPoolOverride` becomes `false` automatically without needing an effect. New test covers the exact scenario (toggle on instrument track, switch to audio, switch to different instrument track).

2. **P3 multi-select ambiguity** — Now uses `selectedTrackIds[0]` consistently via scoped selectors instead of `.find()`, making the behavior explicit and deterministic.

3. **P3 style duplication** — Extracted shared properties into `panelBtnBase` and spread into both buttons.

Bonus: the instrument/drum panel now has `height: 240` matching the piano roll panel, fixing potential layout jitter.

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

- **[P1] `DawShell` and `InstrumentPanel` now disagree on which track is “selected” under multi-select** ([DawShell.tsx:55](/Users/Nathan/Documents/Code/long-running-harness/src/ui/DawShell.tsx:55), [DawShell.tsx:57](/Users/Nathan/Documents/Code/long-running-harness/src/ui/DawShell.tsx:57), [panels.tsx:277](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:277), [panels.tsx:279](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:279))  
  `DawShell` now keys its bottom-panel mode and media-pool override off `selectedTrackIds[0]`, while `InstrumentPanel` still derives `selectedTrack` as the first matching track in `tracks` order. Those are not equivalent once shift-selection preserves click order. In a mixed multi-select, `DawShell` can render the full-width instrument/drum layout for one track while `InstrumentPanel` renders a different track type, so the bottom-panel layout and toggle state can become inconsistent. Use one shared selected-track selector in both places, and add a regression test for multi-select where selection order differs from track order.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
