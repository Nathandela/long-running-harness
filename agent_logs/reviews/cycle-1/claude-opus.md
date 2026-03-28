REVIEW_CHANGES_REQUESTED

1. **P1 — `addSend` skips cycle detection** (`src/audio/mixer/routing.ts:200-235`): `addSend` adds a graph edge `sourceId -> busId` without calling `wouldCauseCycle` first. Only `setBusOutput` checks for cycles. This means `engine.addSend("bus-2", "bus-1")` after `engine.addSend("bus-1", "bus-2")` will silently create a cycle (bus-1 -> bus-2 -> bus-1), corrupting the topological sort and potentially causing infinite audio feedback. Add a `wouldCauseCycle` check before the `graph.addEdge` on line 233, and throw on cycle.

2. **P1 — `removeBus` leaves orphaned `outputTarget` references** (`src/audio/mixer/routing.ts:146-171`): When bus-1 is removed, any other bus whose `outputTarget === "bus-1"` keeps that stale reference. The graph edge is cleaned up via `removeNode`, but the audio connection (via `connectBusOutput`) silently drops to nowhere — the dependent bus is disconnected with no error or fallback to master. Re-route dependent buses to `"master"` on removal.

3. **P2 — Store `addSend` allows duplicate sends** (`src/state/routing/routing-store.ts:71-78`): The audio engine deduplicates sends to the same bus (line 208-209 of routing.ts), but the Zustand store's `addSend` blindly appends. If the store and engine get out of sync, or if `addSend` is called twice from the UI, duplicate state entries accumulate. Add a duplicate check before pushing.

4. **P2 — Store `setBusOutput` has no cycle guard** (`src/state/routing/routing-store.ts:61-69`): The store updates `outputTarget` with no validation. If store updates can be triggered independently of the audio engine (e.g., undo/redo, deserialization), cycles can be created in state. At minimum, document the invariant that the engine must be called first, or add a `wouldCauseCycle` parameter/callback.

5. **P3 — Store `updateSendLevel` missing clamp** (`src/state/routing/routing-store.ts:96-108`): The audio engine clamps levels to [0, 1] but the store accepts any number. The UI slider prevents bad values, but direct store manipulation (tests, deserialization) could set levels > 1 or < 0.
