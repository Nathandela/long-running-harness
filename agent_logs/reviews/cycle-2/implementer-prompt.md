You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All fixes from the previous review (P1 #1, P2 #4, P2 #5, P2 #6, P3 #7) were correctly applied. The `RoutingGraph.clear()` method was added, cycle guard in `addSend`, target validation in `setBusOutput`, orphan pruning in `removeSend`, and level clamping in store all look correct.

Two original findings remain unaddressed:

REVIEW_CHANGES_REQUESTED

**1. [P1] Pre-fader routing has no audio effect — `preFader` flag is decorative**

`routing.ts:223` — `sendGain.connect(bus.inputGain)` is used regardless of `preFader`. A pre-fader send must tap the signal before the source channel's fader. `RoutingEngine` has no reference to `MixerEngine` channel strips, and `ChannelStrip` (`mixer/types.ts:19`) exposes `faderGain` but no pre-fader tap node. The commit message claims pre/post-fader selection is implemented — it is not. Either implement it (requires cross-engine access or a pre-fader tap on `ChannelStrip`) or remove `preFader` from the public API until it is.

---

**2. [P1] `RoutingEngine` is never instantiated in production — UI has no audio effect**

`createRoutingEngine` appears only in `routing.ts` and `routing.test.ts`. `RoutingMatrix.tsx` updates the Zustand store, but no bridge/provider creates a `RoutingEngine` instance or synchronizes store mutations to it. Compare `EffectsBridgeProvider.tsx`, which wires the effects store to `MixerEngine`. Without an equivalent `RoutingBridgeProvider`, all UI interactions (adding sends, toggling pre-fader, setting bus outputs) are visually present but produce zero audio change.
</claude-sonnet-review>

<claude-opus-review>
All 59 tests pass (up from 48), no type errors. Let me verify each finding was addressed:

**P1 #1 — `addSend` cycle detection**: Fixed. `routing.ts:214-216` now calls `wouldCauseCycle` before adding the graph edge, throws on cycle. New test at `routing.test.ts:234-241`.

**P1 #2 — `removeBus` orphaned `outputTarget`**: Fixed. `routing.ts:150-158` re-routes dependent buses to master and updates graph edges. Also removes sidechains referencing the bus (`routing.ts:179-186`). Store does the same (`routing-store.ts:46-49, 63-65`). Tests at `routing.test.ts:183-199` and `routing-store.test.ts:61-87`.

**P2 #3 — Store `addSend` duplicates**: Fixed. `routing-store.ts:83` checks `existing.some((e) => e.busId === send.busId)`. Test at `routing-store.test.ts:113-124`.

**P2 #4 — Store `setBusOutput` cycle guard**: Not added to the store, which is acceptable — the audio engine is the validation authority.

**P3 #5 — Store `updateSendLevel` clamping**: Fixed. `routing-store.ts:100` clamps with `Math.min(1, Math.max(0, level))`. Test at `routing-store.test.ts:126-137`.

**Bonus fixes** beyond what was requested:
- `setBusOutput` validates target exists (`routing.ts:185-187`)
- `removeSend` prunes orphaned source nodes from graph (`routing.ts:252-256`)
- `dispose` calls `graph.clear()` (`routing.ts:328`)
- `RoutingGraph.clear()` method added (`cycle-detection.ts:43-45`)

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

- **[P1] Removing a bus still leaves sends sourced from that bus behind** ([routing.ts:160](/Users/Nathan/Documents/Code/long-running-harness/src/audio/mixer/routing.ts:160), [routing-store.ts:52](/Users/Nathan/Documents/Code/long-running-harness/src/state/routing/routing-store.ts:52), [routing.test.ts:183](/Users/Nathan/Documents/Code/long-running-harness/src/audio/mixer/routing.test.ts:183), [routing-store.test.ts:61](/Users/Nathan/Documents/Code/long-running-harness/src/state/routing/routing-store.test.ts:61))  
  Both the engine and the Zustand store only clean up sends whose `busId` matches the removed bus. If the removed bus itself was a send source, its outgoing sends survive under the `sourceId === removedBusId` entry. That leaves orphaned send routes in state and leaked `sendGain` nodes in the engine. Add explicit cleanup for sends sourced from the removed bus in both layers, and cover the `bus-1 -> bus-2`, then `removeBus("bus-1")` case with regression tests.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
