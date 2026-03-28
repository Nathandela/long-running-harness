You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All findings are resolved:

- **P1 (bridge missing)** — `subscribeModRoutes` implemented in `modulation-bridge.ts` with immediate send + subscription, tested, exported for callsite use. Consistent with the pre-existing state where `createSynthInstrument` itself isn't yet wired to the app.
- **P2 (drag leak)** — document-level `mouseup` listener added via `useEffect`, tested.
- **P2 (type widening)** — `ModulationStore["matrices"]` used in `hydrateStore`, eliminating the `string` widening.
- **P2 (MAX_MOD_ROUTES bypass)** — `routes.slice(0, MAX_MOD_ROUTES)` added on load, tested.
- **P3 (dead code)** — `isPerVoiceSource` removed, `PER_VOICE_SOURCES` exported and tested.

The P3 SVG cable hardcoded positions remain but are cosmetic and not blocking.

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
Checking findings against fixes:

| # | Original Finding | Status |
|---|---|---|
| 1 | P2 `routeCounter` HMR/test | Fixed: `_resetRouteCounter()` added, `Date.now()` removed from ID |
| 2 | P2 Filter coeff once-per-block | Fixed: documented as intentional trade-off |
| 3 | P2 No bridge from store to worklet | **Still open** — `setModRoutes`/`getWorkletRoutes` never called from any `.tsx` |
| 4 | P2 `hydrateStore` weak typing | Fixed: uses `ModulationStore["matrices"]` + `MAX_MOD_ROUTES` enforcement |
| 5 | P3 `diff.patch` in repo | **Still present** |
| 6 | P3 `voiceSrcValues` stale slots | Acceptable (documented by per-voice filter) |
| 7 | P3 `isPerVoiceSource` unused | Fixed: removed function, exported `PER_VOICE_SOURCES` directly |

Additionally, the `ModulationMatrix.tsx` drag-leak was proactively fixed with a document-level `mouseup` listener.

REVIEW_CHANGES_REQUESTED

1. **P2 — No bridge from UI store to worklet is still missing.** Nothing subscribes to `useModulationStore` changes and calls `instrument.setModRoutes(getWorkletRoutes(trackId))`. The modulation matrix UI updates the Zustand store, but routes never reach the `synth-processor`. This is the only functional bug remaining — the entire modulation feature is inert at runtime.

2. **P3 — `diff.patch` still committed in repo root** (2425 lines). Should be deleted or added to `.gitignore`.
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
    at Socket.<anonymous> (node:internal/child_process:456:11)
    at Socket.emit (node:events:518:28)
    at Pipe.<anonymous> (node:net:351:12) {
  code: -32000,
  data: undefined
}
MCP issues detected. Run /mcp list for status.Scheduling MCP context refresh...
Executing MCP context refresh...
MCP context refresh complete.
REVIEW_CHANGES_REQUESTED

1. **Missing Tests (P1):** While tests were added for `toggleRouteBipolar` and session serialization, the missing tests for `setModRoutes`/`setModSource` message handling and per-voice `voiceSrcValues` routing within the AudioWorklet processor context (`synth-processor.ts`) remain unaddressed. No tests cover this logic.

2. **SVG `<line>` Percentage Usage (P3):** The cable visualization in `src/ui/synth/ModulationMatrix.tsx` (around line 217) still uses `x2="100%"`. As previously requested, SVG `<line>` coordinates do not universally support percentage values in all rendering contexts; please switch to using `getBoundingClientRect` or a `viewBox` coordinate system.
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] Hydrated modulation routes can now collide with newly added route IDs** ([modulation-types.ts:55](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/modulation-types.ts:55), [modulation-types.ts:64](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/modulation-types.ts:64), [use-session-persistence.ts:136](/Users/Nathan/Documents/Code/long-running-harness/src/state/session/use-session-persistence.ts:136), [modulation-store.ts:76](/Users/Nathan/Documents/Code/long-running-harness/src/state/synth/modulation-store.ts:76), [modulation-store.ts:94](/Users/Nathan/Documents/Code/long-running-harness/src/state/synth/modulation-store.ts:94))  
  `createModRoute()` now generates deterministic `mod-<counter>` IDs, but hydration restores persisted routes without advancing that counter. After reloading any session that already contains `mod-1`, `mod-2`, etc., the next `addRoute()` can reuse an existing ID. Because remove/update/toggle all key off `routeId`, one UI action can then affect multiple routes or the wrong route. Seed the counter from hydrated data or switch back to a uniqueness-preserving ID strategy and keep deterministic tests via an injectable/resettable generator.

- **[P1] The new modulation bridge is still not wired into runtime synth ownership** ([modulation-bridge.ts:17](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/modulation-bridge.ts:17), [modulation-bridge.test.ts:47](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/modulation-bridge.test.ts:47), [synth-instrument.ts:54](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/synth-instrument.ts:54))  
  The bridge is tested in isolation, but there is still no non-test call site that subscribes a real `SynthInstrument` to modulation-store changes. That means modulation routes can exist in UI state and session persistence while never reaching the live AudioWorklet. Hook the subscription up where synth instruments are created/owned and clean it up with instrument disposal, then cover that path with an integration test.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
