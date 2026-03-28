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

1. **[P0] Bus-to-bus sends emit silence due to incorrect source resolution in `RoutingBridge`.**
   In `src/audio/mixer/routing-bridge.ts`, `wireSend` blindly uses `mixer.getStrip(trackId) ?? mixer.getOrCreateStrip(trackId)` to find the source node. When a bus sends to another bus, this creates a disconnected "ghost" track strip in the `MixerEngine` rather than tapping the actual `BusTrack` from the `RoutingEngine`. The bridge must resolve the source correctly (e.g., checking `routing.getBus(trackId)`) and tap `bus.inputGain`/`bus.faderGain` if the source is a bus. The same bug exists in `unwireSend`.

2. **[P1] Sidechain audio is completely disconnected (AnalyserNodes receive no signal).**
   In `src/audio/mixer/routing-bridge.ts`, the `sync` loop creates sidechains via `routing.addSidechain(...)` but never actually connects the source audio (from either a track strip or a bus) into the resulting `sc.analyser`. Without a `wireSidechain` / `unwireSidechain` equivalent, the sidechain analysis nodes receive no signal.
