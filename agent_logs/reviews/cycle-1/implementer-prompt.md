You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

**1. P3 — Orphaned `.mixer` CSS class**
`MixerPanel.module.css:1-8` — the old `.mixer` class is dead code after the refactor to `.mixer-wrapper`. No file references `styles["mixer"]` anymore. It also carries the old `max-height: 280px` constraint which conflicts with the new 400px. Should be removed to avoid confusion.

**2. P3 — Bridge subscription leaks in tests**
`effects-bridge.test.ts` has no `afterEach(() => bridge.dispose())`. Each test creates a new bridge (+ store subscription) without tearing down the previous one. By the 5th test, 4 stale bridges are firing `sync()` on store mutations. Practically harmless since each test uses fresh mocks, but violates isolation and will confuse future test failures.

**3. P3 — Initial sync path untested**
All tests call `useEffectsStore.setState({ trackEffects: {} })` before `createEffectsBridge(...)`. The constructor's `sync()` therefore always runs on an empty store. The code path where the bridge is created with pre-existing effects (the production boot path, via `EffectsBridgeProvider.useState`) is never exercised. Add one test that populates the store before creating the bridge.
</claude-sonnet-review>

<claude-opus-review>
Clean type-check. Now my full review:

REVIEW_CHANGES_REQUESTED

1. **P2 - ReDoS risk in track name regex** (`src/ui/transport/TransportBar.tsx:65`): `namePrefix` is interpolated directly into `new RegExp(...)` without escaping. The current preset values ("Audio", "Synth", "808") are safe, but "808" contains no special chars only by luck. If a preset name ever contains regex metacharacters (e.g. `C++`, `(Aux)`), this will break or cause unexpected behavior. Escape `namePrefix` before interpolation, or use a simpler `startsWith` + `parseInt` approach.

2. **P2 - Module-level Map caches never shrink** (`src/ui/panels.tsx:20-24`): `sequencerCache` and `paramsCache` are module-level `Map`s keyed by trackId. When a track is deleted, its entries are never removed. Over a long session with many track create/delete cycles, these accumulate orphaned `StepSequencer` instances and param objects. Add cleanup when tracks are removed (e.g., subscribe to store changes, or clear entries in a `useEffect` cleanup).

3. **P3 - `act()` warnings in test** (`src/ui/track-creation.test.tsx`): The "preserves drum params" test triggers React `act()` warnings on stderr from `useDawStore.setState` inside `rerender`. Wrap the state updates in `act(() => { ... })` to silence the warnings and ensure React processes state correctly during assertions.

4. **P3 - EffectsBridge sync runs on every store change** (`src/audio/effects/effects-bridge.ts:110`): `useEffectsStore.subscribe(sync)` fires `sync()` on every state mutation (any slice), not just `trackEffects` changes. If other effects-store slices are added later, every unrelated write will trigger a full reconciliation loop. Consider using `subscribe` with a selector or `subscribeWithSelector` middleware.

5. **P3 - Sidechain filter is O(n) per track row** (`src/ui/mixer/RoutingMatrix.tsx:117-119`): `sidechains.filter(...)` runs for every track on every render. With many tracks and sidechains this is quadratic. Fine for now, but if the matrix grows, pre-index sidechains by sourceId/targetId in a `useMemo`.
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

1. **[P2 - Test Leak]** In `src/audio/effects/effects-bridge.test.ts`, an `EffectsBridge` is instantiated in `beforeEach()`, which adds a subscription to `useEffectsStore`. However, `bridge.dispose()` is never called in an `afterEach()`. This leaks Zustand store subscriptions across tests, potentially causing memory leaks and unintended side effects during subsequent test runs.
2. **[P2 - Edge Case]** In `src/ui/mixer/MixerPanel.tsx`, `EffectsRack` is rendered whenever `selectedFxTrackId !== null`. If the corresponding track is deleted from the DAW store while its FX rack is open, the rack remains mounted for a non-existent track. Add a check to ensure the track still exists before rendering it (e.g., `selectedFxTrackId !== null && tracks.some(t => t.id === selectedFxTrackId)`).
3. **[P3 - Unused CSS]** In `src/ui/mixer/MixerPanel.module.css`, the `.mixer` class was orphaned when it was replaced by `.mixer-wrapper`. It should be removed as it is no longer used.
4. **[P3 - Test Mock Correctness]** In `src/audio/effects/effects-bridge.test.ts`, `mockGainNode()` mocks the `connect` method with `vi.fn().mockReturnThis()`. Under the standard Web Audio API, `connect(destinationNode)` returns the *destination* node, not the source node (`this`). While this doesn't break the current tests, it is an incorrect representation of the API that could break future tests if connection chaining is introduced.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
