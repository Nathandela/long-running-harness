You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

**1. P2 — `showMediaPoolOverride` not reset on track change** (`DawShell.tsx:48`)

`showMediaPoolOverride` is never reset when the selected track changes. If a user toggles to media pool view for an instrument track, switches to an audio track (side-by-side layout), then switches back to an instrument track, `showMediaPoolOverride` is still `true` — the instrument panel never appears. A `useEffect` keyed on `selectedTrack?.id` should reset it to `false`.

**2. P2 — Test doesn't cover the stale-override scenario** (`DawShell-bottom-panel.test.tsx:208`)

The test named "resets to instrument view when switching from audio to instrument track" passes only because `showMediaPoolOverride` was never toggled to `true` before the track switch. It doesn't verify actual reset behavior. A test should click the toggle button first, then switch tracks, and assert InstrumentPanel is shown.

**3. P3 — `selectedTrack` uses `Array.find` over all tracks for each render** (`DawShell.tsx:53`)

`tracks.find((t) => selectedTrackIds.includes(t.id))` does an O(n×m) scan on every render. With many tracks this is wasteful; prefer `tracks.find((t) => t.id === selectedTrackIds[0])` or a Map lookup if the selection is expected to be single or primary-track semantics apply here.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P2 — `showMediaPoolOverride` not reset on track selection change.** When a user toggles to media pool view on an instrument track, then selects an audio track (side-by-side mode), then selects another instrument track, `showMediaPoolOverride` remains `true` — they see the media pool instead of the instrument panel. Add an effect to reset it:
   ```tsx
   useEffect(() => { setShowMediaPoolOverride(false); }, [isInstrumentOrDrum]);
   ```
   The existing test "resets to instrument view when switching from audio to instrument track" doesn't cover this because it never toggles `showMediaPoolOverride` before switching tracks.

2. **P3 — `selectedTrack` picks first match with multi-select.** `tracks.find((t) => selectedTrackIds.includes(t.id))` silently takes the first match in `tracks` array order when multiple tracks are selected. If the user selects both an audio and an instrument track, the layout depends on which appears first in the tracks array. Consider using the *last* selected track ID (`selectedTrackIds.at(-1)`) for more predictable behavior, or document the current heuristic.

3. **P3 — Inline style duplication.** The close button and toggle button share nearly identical absolute-positioned button styling (position, top, right, zIndex, cursor, fontFamily). Consider extracting a shared style object to avoid drift between the two.
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
    at ChildProcess._handle.onexit (node:internal/child_process:304:5) {
  code: -32000,
  data: undefined
}
MCP issues detected. Run /mcp list for status.Scheduling MCP context refresh...
Executing MCP context refresh...
MCP context refresh complete.
REVIEW_CHANGES_REQUESTED
1. **P1 - Severe Performance Regression in `DawShell.tsx`**: You are calling `const tracks = useDawStore((s) => s.tracks)`. Because this returns the entire array by reference, `DawShellInner` (which wraps almost all the DAW UI) will now re-render on *every* track mutation, such as moving a volume fader, panning, or soloing. You must use a scoped selector to only return the primitive boolean value so React bails out of re-renders:
   ```typescript
   const isInstrumentOrDrum = useDawStore((s) => {
     const track = s.tracks.find((t) => s.selectedTrackIds.includes(t.id));
     return track?.type === "instrument" || track?.type === "drum";
   });
   ```
2. **P2 - Layout Jitter on Toggle**: The `InstrumentPanel` has a height of 240px, while the `MediaPoolPanel` has a height of 200px. When the user clicks the "Media Pool / Instrument" toggle button, the bottom panel's height shifts by 40px, causing the main `ArrangementPanel` to snap back and forth. You should add a fixed `height: 240` to the wrapper `div` in the `isInstrumentOrDrum` branch to prevent layout shifting.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
