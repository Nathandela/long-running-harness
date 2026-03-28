You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**Findings:**

**P1 — Bugs that will break functionality**

1. **Recovery dialog never shows** (`DawShell.tsx:26`): `useState(recoveryWarnings.length > 0)` captures the initial value once — before the async load completes, `recoveryWarnings` is always `[]`. Subsequent `setRecoveryWarnings(...)` calls update the returned array but React's `useState` doesn't re-initialize from it. `showRecovery` is permanently `false`. Fix: add a `useEffect` that calls `setShowRecovery(true)` when `recoveryWarnings.length > 0`.

2. **Save queue permanently broken after first IDB error** (`save-queue.ts:23-30`): `inflight` is set to `null` only inside `processQueue()`, which is called via `.then()`. If `doSave` (or an inner `doSave` in the loop) throws, the `.then()` callback never runs and `inflight` stays pointing at the rejected promise. All future `enqueue` calls short-circuit on `inflight !== null` and return the stale rejection. Fix: reset `inflight = null` in a `.finally()` block or in a `try/finally` inside `processQueue`.

3. **Draft-then-swap is incomplete** (`use-session-persistence.ts:63-64`): On mount, only `getCurrent()` is read. A crash between `putDraft` and `putCurrent` leaves a draft in IDB that is never checked or recovered. The advertised crash-safety guarantee is not implemented. Fix: on load, check for a draft first — if one exists, use it (it's the most recent write attempt).

**P2 — Correctness issues**

4. **`createdAt` overwritten on every save** (`use-session-persistence.ts:13`): `storeToSession()` sets `meta.createdAt: Date.now()` unconditionally, so the original session creation time is lost after the first auto-save. The store has no `createdAt` field to round-trip this value through.

5. **Unsafe cast in recovery** (`session-recovery.ts:38`): After `fullResult` fails, `parsed` is cast to `Record<string, unknown>`. If the JSON is `null`, `42`, `[]`, or any non-object, subsequent indexed property accesses are wrong. Each `safeParse` would fall back to defaults silently, but the cast itself is unsound. Needs an `if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))` guard before line 38.

6. **IDB `dbPromise` cached on rejection** (`session-storage.ts:173-180`): If `openSessionDb()` rejects (e.g. storage quota, blocked by another tab), `dbPromise` is left as the rejected promise. Every subsequent call to `getDb()` returns the same rejection with no retry. A transient open failure becomes a permanent one for the tab's lifetime.

**P3 — Quality / minor**

7. **`listSessions()` IDB N+1** (`session-storage.ts:211-229`): Fetches all keys, then issues one `idbGet` per key in a loop (separate read transactions). Use a single `getAll()` call to the object store instead.

8. **`sessionSchema.version` unconstrained** (`session-schema.ts:24`): `z.number()` accepts any number. A session from a future schema version will load without warning. Consider `z.literal(SESSION_VERSION)` or at minimum `z.number().max(SESSION_VERSION)` with a migration hook, so future version bumps are handled explicitly rather than silently.

9. **`RecoveryDialog.onDiscard` doesn't reset state** (`RecoveryDialog.tsx:17`, `DawShell.tsx:71-73`): Both "Continue" and "Discard" just hide the dialog; "Discard" should reset the store to `createDefaultSession()` defaults to match user expectation.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P0 - SaveQueue deadlocks on IDB error.** `save-queue.ts:38` — if `doSave` throws (e.g., IndexedDB quota exceeded, permission error), the `.then()` chain rejects, `processQueue` never runs, and `inflight` is never reset to `null`. All subsequent `enqueue` calls return the rejected promise forever, silently killing auto-save with no user indication. The `void` in `auto-save.ts:28` swallows the rejection. Fix: wrap `doSave`/`processQueue` in try/catch, reset `inflight = null` in a finally block, and surface errors.

2. **P1 - RecoveryDialog never opens.** `DawShell.tsx:26` — `useState(recoveryWarnings.length > 0)` captures the *initial* value of `recoveryWarnings`, which is always `[]` (set at `use-session-persistence.ts:46`). Warnings are populated asynchronously after mount. Since `useState` only reads its initializer once, `showRecovery` stays `false` permanently. Fix: use a `useEffect` that watches `recoveryWarnings` to trigger `setShowRecovery(true)`.

3. **P1 - `storeToSession` destroys session metadata on every save.** `use-session-persistence.ts:10-25` — `createdAt`, `updatedAt`, and `name` are hardcoded to `Date.now()` and `"Untitled"` on every call. When a session named "My Song" is loaded, the next auto-save overwrites it as "Untitled" with a fresh `createdAt`. The loaded session's meta is never preserved because `hydrateStore` only restores transport fields. Fix: store the loaded session meta (name, createdAt) in a ref or in the zustand store, and use it in `storeToSession`.

4. **P1 - "Start fresh" button doesn't reset state.** `DawShell.tsx:71-73` — `onDiscard` only calls `setShowRecovery(false)`, leaving the partially-recovered (potentially corrupt) session hydrated in the store. The button text promises a fresh session but delivers the recovered one. Fix: call `hydrateStore(createDefaultSession())` in `onDiscard`.

5. **P2 - No schema range constraints.** `session-schema.ts` — `bpm` accepts negative, zero, Infinity; `masterVolume` has no bounds; `loopEnd` can be less than `loopStart`. Add `.min()/.max()` constraints and a `loopEnd >= loopStart` refinement.

6. **P2 - N+1 IDB reads in `listSessions`.** `session-storage.ts:213-229` — loads all keys then fetches each entry individually. Use `getAll()` to retrieve all entries in a single transaction.
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

1. **[P1] Incorrect initialization of UI state:** In `src/ui/DawShell.tsx`, the `showRecovery` state is initialized via `useState(recoveryWarnings.length > 0)`. Because `recoveryWarnings` populates asynchronously after IDB load, React ignores the initial state value on subsequent renders. This causes `showRecovery` to permanently remain `false`, preventing the `RecoveryDialog` from ever rendering. Use a derived boolean or a `useEffect` to synchronize visibility.
2. **[P1] App crash on malformed session JSON:** In `src/state/session/session-recovery.ts`, if `JSON.parse(raw)` evaluates to `null` (e.g., from `raw === "null"`), `parsed` is assigned `null`. Consequently, `const obj = parsed as Record<string, unknown>;` assigns `null` to `obj`, and accessing `obj["meta"]` throws a `TypeError: Cannot read properties of null`, crashing the application initialization. Validate that `parsed` is a non-null object before attempting partial recovery.
3. **[P2] "Start fresh" option fails to reset state:** In `src/ui/DawShell.tsx`, the `onDiscard` handler passed to `RecoveryDialog` merely dismisses the dialog via `setShowRecovery(false)`. It does not clear the partially recovered session or reset the DAW store. The user remains stuck with the broken session despite explicitly selecting "Start fresh". The handler must be updated to overwrite the store with default values and trigger a save.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
