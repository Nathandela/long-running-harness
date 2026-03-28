REVIEW_CHANGES_REQUESTED

1. **P0 - SaveQueue deadlocks on IDB error.** `save-queue.ts:38` — if `doSave` throws (e.g., IndexedDB quota exceeded, permission error), the `.then()` chain rejects, `processQueue` never runs, and `inflight` is never reset to `null`. All subsequent `enqueue` calls return the rejected promise forever, silently killing auto-save with no user indication. The `void` in `auto-save.ts:28` swallows the rejection. Fix: wrap `doSave`/`processQueue` in try/catch, reset `inflight = null` in a finally block, and surface errors.

2. **P1 - RecoveryDialog never opens.** `DawShell.tsx:26` — `useState(recoveryWarnings.length > 0)` captures the *initial* value of `recoveryWarnings`, which is always `[]` (set at `use-session-persistence.ts:46`). Warnings are populated asynchronously after mount. Since `useState` only reads its initializer once, `showRecovery` stays `false` permanently. Fix: use a `useEffect` that watches `recoveryWarnings` to trigger `setShowRecovery(true)`.

3. **P1 - `storeToSession` destroys session metadata on every save.** `use-session-persistence.ts:10-25` — `createdAt`, `updatedAt`, and `name` are hardcoded to `Date.now()` and `"Untitled"` on every call. When a session named "My Song" is loaded, the next auto-save overwrites it as "Untitled" with a fresh `createdAt`. The loaded session's meta is never preserved because `hydrateStore` only restores transport fields. Fix: store the loaded session meta (name, createdAt) in a ref or in the zustand store, and use it in `storeToSession`.

4. **P1 - "Start fresh" button doesn't reset state.** `DawShell.tsx:71-73` — `onDiscard` only calls `setShowRecovery(false)`, leaving the partially-recovered (potentially corrupt) session hydrated in the store. The button text promises a fresh session but delivers the recovered one. Fix: call `hydrateStore(createDefaultSession())` in `onDiscard`.

5. **P2 - No schema range constraints.** `session-schema.ts` — `bpm` accepts negative, zero, Infinity; `masterVolume` has no bounds; `loopEnd` can be less than `loopStart`. Add `.min()/.max()` constraints and a `loopEnd >= loopStart` refinement.

6. **P2 - N+1 IDB reads in `listSessions`.** `session-storage.ts:213-229` — loads all keys then fetches each entry individually. Use `getAll()` to retrieve all entries in a single transaction.
