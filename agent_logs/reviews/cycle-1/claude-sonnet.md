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
