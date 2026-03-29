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

1. **[P2 - Test Leak]** In `src/audio/effects/effects-bridge.test.ts`, an `EffectsBridge` is instantiated in `beforeEach()`, which adds a subscription to `useEffectsStore`. However, `bridge.dispose()` is never called in an `afterEach()`. This leaks Zustand store subscriptions across tests, potentially causing memory leaks and unintended side effects during subsequent test runs.
2. **[P2 - Edge Case]** In `src/ui/mixer/MixerPanel.tsx`, `EffectsRack` is rendered whenever `selectedFxTrackId !== null`. If the corresponding track is deleted from the DAW store while its FX rack is open, the rack remains mounted for a non-existent track. Add a check to ensure the track still exists before rendering it (e.g., `selectedFxTrackId !== null && tracks.some(t => t.id === selectedFxTrackId)`).
3. **[P3 - Unused CSS]** In `src/ui/mixer/MixerPanel.module.css`, the `.mixer` class was orphaned when it was replaced by `.mixer-wrapper`. It should be removed as it is no longer used.
4. **[P3 - Test Mock Correctness]** In `src/audio/effects/effects-bridge.test.ts`, `mockGainNode()` mocks the `connect` method with `vi.fn().mockReturnThis()`. Under the standard Web Audio API, `connect(destinationNode)` returns the *destination* node, not the source node (`this`). While this doesn't break the current tests, it is an incorrect representation of the API that could break future tests if connection chaining is introduced.
