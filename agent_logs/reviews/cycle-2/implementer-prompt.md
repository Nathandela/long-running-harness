You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All 9 findings verified:

- **P1-1 (recovery dialog)**: Fixed — `!dismissed && recoveryWarnings.length > 0` is reactive, not captured at init.
- **P1-2 (save queue broken on error)**: Fixed — `try/finally { inflight = null }` in the IIFE.
- **P1-3 (draft recovery)**: Fixed — loads draft first: `draft ?? getCurrent()`, with crash-recovery warning.
- **P2-4 (createdAt overwritten)**: Fixed — module-level `sessionMeta` preserved across saves, updated in `hydrateStore`.
- **P2-5 (unsafe cast)**: Fixed — object type guard added before the cast.
- **P2-6 (IDB N+1)**: Fixed — `idbGetAll` uses a single transaction with `getAllKeys()` + `getAll()`.
- **P2-7 (version unconstrained)**: Fixed — `z.literal(SESSION_VERSION)`.
- **P3-8 (discard doesn't reset)**: Fixed — `hydrateStore(createDefaultSession())` on discard.
- **P3-9 (dbPromise cached on rejection)**: Fixed — `dbPromise = null` in catch before rethrowing.

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All 66 tests pass, TypeScript clean, ESLint clean. Let me verify each original finding against the fixes:

| # | Finding | Status |
|---|---------|--------|
| 1 | P0 - SaveQueue deadlock on error | Fixed: `try/finally` resets `inflight = null` |
| 2 | P1 - RecoveryDialog never opens | Fixed: derived `showRecovery = !dismissed && recoveryWarnings.length > 0` reacts to async state |
| 3 | P1 - storeToSession destroys metadata | Fixed: module-level `sessionMeta` preserved by `hydrateStore`, used in `storeToSession` |
| 4 | P1 - "Start fresh" doesn't reset | Fixed: `onDiscard` calls `hydrateStore(createDefaultSession())` |
| 5 | P2 - No schema range constraints | Fixed: bpm 1-999, volume 0-2, loopStart/End >= 0, loopEnd >= loopStart refinement, version literal |
| 6 | P2 - N+1 IDB reads in listSessions | Fixed: new `idbGetAll` reads keys+values in single transaction |

Bonus improvements in the fix commit: non-object JSON guard in recovery, draft-first loading for crash safety, IDB open retry on failure (`dbPromise = null` in catch).

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

- **[P1] The save queue can still write an older queued snapshot after a failed save** ([save-queue.ts:23](/Users/Nathan/Documents/Code/long-running-harness/src/state/session/save-queue.ts:23), [save-queue.ts:37](/Users/Nathan/Documents/Code/long-running-harness/src/state/session/save-queue.ts:37), [save-queue.test.ts:28](/Users/Nathan/Documents/Code/long-running-harness/src/state/session/save-queue.test.ts:28))  
  The deadlock is fixed, but the failure path is still unsafe. If save `A` is inflight, `enqueue(B)` stores `queued = B`, and `doSave(A)` rejects, `inflight` is cleared in `finally` while `queued` survives. The next `enqueue(C)` will save `C` and then `processQueue()` will persist stale `B`, rolling storage backward to an older session. Clear or explicitly handle `queued` on failure before accepting new work, and add a regression test that forces a failing save with a queued follow-up.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
