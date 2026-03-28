FIXES_APPLIED

**Summary of all fixes:**

| Finding | Severity | Fix |
|---|---|---|
| SaveQueue deadlocks on IDB error | P0 | Wrapped `doSave`+`processQueue` in `try/finally` that always resets `inflight = null` |
| RecoveryDialog never opens | P1 | Replaced `useState(recoveryWarnings.length > 0)` with derived `!dismissed && recoveryWarnings.length > 0` |
| `createdAt`/`name` overwritten on every save | P1 | Added `sessionMeta` module state, preserved by `hydrateStore`, used by `storeToSession` |
| "Start fresh" doesn't reset state | P1 | `onDiscard` now calls `hydrateStore(createDefaultSession())` before dismissing |
| Crash on null/non-object JSON parse | P1 | Added `typeof`/`null`/`Array.isArray` guard before casting to `Record<string, unknown>` |
| IDB `dbPromise` cached on rejection | P2 | `.catch()` resets `dbPromise = null` so transient failures retry |
| `listSessions` N+1 reads | P2 | Replaced per-key `idbGet` loop with single `idbGetAll` (keys + values in one transaction) |
| Schema unconstrained | P2 | `bpm: 1-999`, `loopStart/End >= 0`, `loopEnd >= loopStart`, `masterVolume: 0-2`, `version: z.literal(1)` |
| Draft not checked on load | P2 | Load checks `getDraft()` first, falls back to `getCurrent()` for crash safety |
