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
