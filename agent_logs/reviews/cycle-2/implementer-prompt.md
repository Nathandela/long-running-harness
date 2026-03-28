You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All 6 findings are addressed:

- **P1 (race)**: `setAudioStarted(true)` now inside `.then()` fulfillment handler — DawShell only renders after engine is running.
- **P1 (unhandled rejection)**: Two-argument `.then(onFulfilled, onRejected)` form — rejection sets `engineStatus("error")` and clears `engineRef`.
- **P2 (sync throw)**: `createAudioEngine()` wrapped in try/catch — sets `"error"` status on unsupported platforms.
- **P2 (Atomics)**: Layout comment now documents the Float32/Float64 restriction with guidance on Int32Array/BigInt64Array views.
- **P2 (BPM validation)**: Clamped 20–999, NaN/non-finite guarded correctly (`Math.max/min` propagates NaN, caught by `Number.isFinite`).
- **P3 (padding)**: `// Bytes 9-11: alignment padding (reserved, do not use)` comment added.

Bonus fixes (double-click guard, `useEffect` cleanup for HMR, `e.preventDefault()` on Space) are all correct.

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All six original findings addressed:

1. **P1 AudioContext cleanup** — Fixed. `useEffect` cleanup calls `engine.close()` on unmount (line 40-45).
2. **P1 resume() error handling** — Fixed. `.then(onFulfilled, onRejected)` pattern sets `"error"` status and nulls the ref on failure (lines 28-37).
3. **P2 double-click guard** — Fixed. `if (engineRef.current) return;` at line 17. New test confirms it.
4. **P2 BPM validation** — Fixed. Clamp to 20-999 + `Number.isFinite` guard (lines 58-60).
5. **P3 dead engineRef** — Fixed. Now used in cleanup effect and double-click guard.
6. **P3 shell scripts / improve dir** — Acknowledged as out-of-scope for this fix pass (cosmetic).

50 tests passing, 0 failures. The atomics documentation on `TransportLayout` and alignment padding comment are good additions.

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
REVIEW_APPROVED
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] Startup failure handling still leaks and races the audio engine** ([src/App.tsx:28](/Users/Nathan/Documents/Code/long-running-harness/src/App.tsx:28), [src/App.tsx:40](/Users/Nathan/Documents/Code/long-running-harness/src/App.tsx:40))  
  The new `resume()` path clears `engineRef.current` on rejection, but it never closes the `AudioContext` that was just created. Repeated failed starts can therefore accumulate live contexts until the browser hits its context limit. The same promise chain also has no liveness guard, so if the component unmounts while `resume()` is in flight, cleanup closes the engine and the success callback can still mark the global store `running` afterward. Close the specific `engine` on rejection and gate both callbacks behind an `isMounted`/current-engine check; add a test for `unmount before resume settles` and one asserting `close()` is called after a rejected `resume()`.

- **[P1] The latest test changes fail the lint gate, so CI is still broken** ([src/App.test.tsx:51](/Users/Nathan/Documents/Code/long-running-harness/src/App.test.tsx:51), [src/App.test.tsx:69](/Users/Nathan/Documents/Code/long-running-harness/src/App.test.tsx:69), [src/App.test.tsx:78](/Users/Nathan/Documents/Code/long-running-harness/src/App.test.tsx:78), [src/App.test.tsx:84](/Users/Nathan/Documents/Code/long-running-harness/src/App.test.tsx:84), [src/App.test.tsx:105](/Users/Nathan/Documents/Code/long-running-harness/src/App.test.tsx:105))  
  `pnpm test` passes, but `pnpm lint` now fails with four `@typescript-eslint/require-await` errors and one `@typescript-eslint/no-extraneous-class` error introduced in the new tests. That means the branch still does not satisfy the project quality gate. Remove the unnecessary `async` wrappers around those `act` blocks, and replace the constructor-only stub with a lint-compliant mock shape.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
