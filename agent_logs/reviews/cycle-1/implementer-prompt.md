You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. [P1] `addSend` has no cycle guard — audio feedback loop possible**

`routing.ts:232-233` — `addSend` adds a graph edge without calling `wouldCauseCycle`. Since buses are valid send sources (proven by the render-order test at line 229: `engine.addSend("bus-1", "bus-2")`), calling `engine.addSend("bus-2", "bus-1")` after the above would silently create a cycle and produce an audio feedback loop. `setBusOutput` guards cycles but `addSend` does not.

---

**2. [P1] Pre-fader routing is unimplemented — `preFader` flag is decorative**

`routing.ts:219` — `addSend` always connects `sendGain` to `bus.inputGain` regardless of `preFader`. A real pre-fader send must tap the signal before the source channel's fader gain. The `RoutingEngine` has no reference to channel strips, so it cannot connect to the correct tap point. The `preFader` property is stored and tested but has zero effect on audio routing.

---

**3. [P1] UI actions are not bridged to the audio engine**

`RoutingMatrix.tsx:71` (EmptyCell `addSend`) and `RoutingMatrix.tsx:43` (`togglePreFader`) — these call Zustand store methods only. There is no code path that calls `routingEngine.addSend()` or `routingEngine.setSendLevel()`. Sends added through the UI are visually present but produce no audio. The `RoutingStore` and `RoutingEngine` are parallel but never synchronized.

---

**4. [P2] `setBusOutput` disconnects bus audio silently on unknown target**

`routing.ts:107-115` — `connectBusOutput` calls `bus.analyser.disconnect()` unconditionally, then only reconnects if the target exists. If `setBusOutput("bus-1", "nonexistent")` is called, bus-1's output is disconnected and goes silent with no error. Should either validate the target exists before disconnecting, or throw the cycle-check error path sooner.

---

**5. [P2] Source nodes are not pruned from graph after `removeSend`**

`routing.ts:254` — `removeSend` removes the edge but never removes the source node when it has no remaining sends. `getRenderOrder()` then returns orphaned source IDs (tracks/buses with no active routing), producing an incorrect topological order. The node should be removed when its send list empties.

---

**6. [P2] `dispose()` does not clear the routing graph**

`routing.ts:308-329` — `dispose()` clears buses, sends, and sidechains but not the `graph`. Nodes and edges from the pre-dispose state remain. Any post-dispose call to `getRenderOrder()` or `wouldCauseCycle()` returns stale results. Add `graph.clear()` (or reset via a new `RoutingGraph()`) in `dispose()`.

---

**7. [P3] `updateSendLevel` in Zustand store does not clamp**

`routing-store.ts:97-109` — `updateSendLevel` writes the raw level value without clamping to `[0, 1]`. The engine's `setSendLevel` clamps, but if the store is updated directly (e.g., from persisted state or tests), the store can hold values the engine would reject, causing state divergence.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P1 — `addSend` skips cycle detection** (`src/audio/mixer/routing.ts:200-235`): `addSend` adds a graph edge `sourceId -> busId` without calling `wouldCauseCycle` first. Only `setBusOutput` checks for cycles. This means `engine.addSend("bus-2", "bus-1")` after `engine.addSend("bus-1", "bus-2")` will silently create a cycle (bus-1 -> bus-2 -> bus-1), corrupting the topological sort and potentially causing infinite audio feedback. Add a `wouldCauseCycle` check before the `graph.addEdge` on line 233, and throw on cycle.

2. **P1 — `removeBus` leaves orphaned `outputTarget` references** (`src/audio/mixer/routing.ts:146-171`): When bus-1 is removed, any other bus whose `outputTarget === "bus-1"` keeps that stale reference. The graph edge is cleaned up via `removeNode`, but the audio connection (via `connectBusOutput`) silently drops to nowhere — the dependent bus is disconnected with no error or fallback to master. Re-route dependent buses to `"master"` on removal.

3. **P2 — Store `addSend` allows duplicate sends** (`src/state/routing/routing-store.ts:71-78`): The audio engine deduplicates sends to the same bus (line 208-209 of routing.ts), but the Zustand store's `addSend` blindly appends. If the store and engine get out of sync, or if `addSend` is called twice from the UI, duplicate state entries accumulate. Add a duplicate check before pushing.

4. **P2 — Store `setBusOutput` has no cycle guard** (`src/state/routing/routing-store.ts:61-69`): The store updates `outputTarget` with no validation. If store updates can be triggered independently of the audio engine (e.g., undo/redo, deserialization), cycles can be created in state. At minimum, document the invariant that the engine must be called first, or add a `wouldCauseCycle` parameter/callback.

5. **P3 — Store `updateSendLevel` missing clamp** (`src/state/routing/routing-store.ts:96-108`): The audio engine clamps levels to [0, 1] but the store accepts any number. The UI slider prevents bad values, but direct store manipulation (tests, deserialization) could set levels > 1 or < 0.
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

1. **[P0] `RoutingEngine.addSend` does not check for or prevent cycles:**
   The `addSend` method in `src/audio/mixer/routing.ts` lacks the `graph.wouldCauseCycle(sourceId, busId)` check that `setBusOutput` correctly performs. Because `sourceId` can be any string (including another bus), this allows the creation of feedback loops in the routing graph (e.g., `busA` sends to `busB`, and `busB` outputs to `busA`), which defeats the stated "cycle-safe output routing" requirement.

2. **[P1] Dangling output targets and disconnected audio on bus removal:**
   In `src/audio/mixer/routing.ts`, `removeBus` removes sends that target the bus, but it fails to reset the `outputTarget` of other buses that route to it. If `busA.outputTarget === busB.id` and `busB` is removed, `busA`'s output remains pointed at the deleted bus and is permanently disconnected from the master mix. The same issue exists in `src/state/routing/routing-store.ts` where the Zustand state retains the deleted `outputTarget`.

3. **[P1] Dangling sidechains on bus removal:**
   In both `src/audio/mixer/routing.ts` and `src/state/routing/routing-store.ts`, `removeBus(id)` does not clean up sidechain assignments where the `sourceId` or `targetId` matches the removed bus `id`. This leaves disconnected `AnalyserNode` instances in memory and stale sidechain badges in the UI.

4. **[P2] `addSend` allows duplicate entries in Zustand store:**
   In `src/state/routing/routing-store.ts`, the `addSend` action blindly appends the incoming send to the `sends[trackId]` array without checking if a send for that `busId` already exists. While the audio engine correctly guards against duplicates, the store state can become polluted with redundant send objects.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
