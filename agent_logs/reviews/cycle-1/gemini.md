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

1. **[P1] Incorrect initialization of UI state:** In `src/ui/DawShell.tsx`, the `showRecovery` state is initialized via `useState(recoveryWarnings.length > 0)`. Because `recoveryWarnings` populates asynchronously after IDB load, React ignores the initial state value on subsequent renders. This causes `showRecovery` to permanently remain `false`, preventing the `RecoveryDialog` from ever rendering. Use a derived boolean or a `useEffect` to synchronize visibility.
2. **[P1] App crash on malformed session JSON:** In `src/state/session/session-recovery.ts`, if `JSON.parse(raw)` evaluates to `null` (e.g., from `raw === "null"`), `parsed` is assigned `null`. Consequently, `const obj = parsed as Record<string, unknown>;` assigns `null` to `obj`, and accessing `obj["meta"]` throws a `TypeError: Cannot read properties of null`, crashing the application initialization. Validate that `parsed` is a non-null object before attempting partial recovery.
3. **[P2] "Start fresh" option fails to reset state:** In `src/ui/DawShell.tsx`, the `onDiscard` handler passed to `RecoveryDialog` merely dismisses the dialog via `setShowRecovery(false)`. It does not clear the partially recovered session or reset the DAW store. The user remains stuck with the broken session despite explicitly selecting "Start fresh". The handler must be updated to overwrite the store with default values and trigger a save.
