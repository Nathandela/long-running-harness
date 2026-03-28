You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
Based on my review of the modulation system changes (E12), here are my findings:

REVIEW_CHANGES_REQUESTED

---

**1. P1 — Modulation routes never reach the AudioWorklet (feature is entirely non-functional)**

`getWorkletRoutes()` and `instrument.setModRoutes()` are both implemented, but nothing connects the Zustand modulation store to the synth instrument. No subscriber or bridge calls `getWorkletRoutes(trackId)` and forwards the result to `instrument.setModRoutes(routes)` when routes change. The UI works, persistence works, but modulation has zero effect on audio output. This is the core deliverable of E12 and it's missing.

**2. P2 — Drag state leaks when mouse released outside component**

`ModulationMatrix.tsx`: `dragSource` is only cleared by `onMouseUp` on the container `div`. If the user drags off the component and releases, `dragSource` stays set — the next `mousedown` on any source port then reads a stale value. Needs a `document`-level `mouseup` listener (e.g. in a `useEffect`).

**3. P2 — Session hydration bypasses route type safety**

`hydrateStore` (`use-session-persistence.ts:131-148`) constructs `matrices` with `source: string` / `destination: string`, then calls `useModulationStore.setState({ matrices })`. The store's type expects `ModSource` / `ModDestination`. When `getWorkletRoutes` is eventually wired up, `SOURCE_INDEX[r.source]` on a `string`-typed value can produce `undefined` as `sourceIdx`, which the worklet would receive silently. The Zod validation in `recoverSession` provides runtime safety, but the types should be cast explicitly after schema parse.

**4. P2 — MAX_MOD_ROUTES not enforced on session load**

`addRoute` guards against >32 routes, but `hydrateStore` calls `useModulationStore.setState({ matrices })` directly, bypassing that guard. A crafted session file can load unlimited routes, feeding an unbounded `modRoutes` array into `process()`.

**5. P3 — `isPerVoiceSource` is dead code**

`modulation-types.ts:30-32` defines `isPerVoiceSource`, but `synth-processor.ts` hardcodes the same per-voice/global split with explicit `SOURCE_INDEX` comparisons. The function is never called. If a source is added, the processor's inline checks must be updated separately — a maintenance trap.

**6. P3 — SVG cable positions are pixel-hardcoded**

`ModulationMatrix.tsx:201-202`: `srcY = 20 + srcIdx * 22` / `destY = 20 + destIdx * 22` — hardcoded pixel offsets that don't measure actual port positions. Any token or spacing change will misalign cables.
</claude-sonnet-review>

<claude-opus-review>
The `hydrateStore` in `use-session-persistence.ts:131-148` types the restored routes with `source: string` and `destination: string`, but the store's `TrackModMatrix` expects `readonly ModRoute[]` where `ModRoute.source` is `ModSource` (a string literal union). Since `useModulationStore.setState({ matrices })` is called with these weakly-typed objects, TypeScript should catch this... but the inline type annotation at line 131-142 uses `string` not `ModSource`. Let me check if this actually compiles:

We already confirmed `tsc --noEmit` passes, so TypeScript is accepting this — the store type must be loose enough. But semantically the deserialized routes bypass the `MOD_SOURCES` validation. The Zod schema validates on load via `recoverSession`, so this is actually safe at runtime. It's a minor type-safety concern only.

REVIEW_CHANGES_REQUESTED

## Findings

1. **P2 — `routeCounter` module-level mutable state is not idempotent across HMR/tests** (`modulation-types.ts:59`). The `let routeCounter = 0` increments globally and never resets. In test suites that re-import, or during Vite HMR, route IDs can collide or become unpredictable. Since the ID also includes `Date.now()`, collision risk is low in practice, but the counter monotonically grows across the module lifetime. Consider using `crypto.randomUUID()` or at minimum resetting the counter in test teardown.

2. **P2 — Filter coefficients only recompute at sample 0, but modulation varies per-sample** (`synth-processor.ts:436`). The `if (s === 0)` block computes biquad coefficients once per 128-sample quantum, but `modFilterCutoff` and `modFilterReso` are recalculated per-sample (lines 409-412). The first sample's modulation values are applied to the entire block. For fast LFO rates (20Hz) modulating filter cutoff, this creates audible zipper artifacts. Either move coefficient computation inside the sample loop (expensive) or interpolate coefficients, or document this as an intentional trade-off.

3. **P2 — No bridge from UI store changes to worklet** (`ModulationMatrix.tsx`, `modulation-store.ts`). The `ModulationMatrix` UI calls `addRoute`/`removeRoute`/`updateAmount`/`toggleBipolar` on the Zustand store, and `getWorkletRoutes()` exists to convert to worklet format, but nothing subscribes to store changes and calls `instrument.setModRoutes()`. The modulation matrix state lives in the store but is never sent to the `synth-processor`. Routes configured in the UI will have no audio effect.

4. **P2 — `hydrateStore` sets `matrices` with `source: string` instead of `ModSource`** (`use-session-persistence.ts:131-148`). The inline type uses `source: string` and `destination: string` rather than `ModSource`/`ModDestination`. While Zod validation in `recoverSession` ensures valid values at runtime, the Zustand store now holds incorrectly-typed data that downstream consumers (e.g., `SOURCE_INDEX[r.source]`) rely on being literal union types. The `getWorkletRoutes` lookup (`SOURCE_INDEX[r.source]`) will work because JS doesn't enforce literal types, but any future code that pattern-matches on `r.source` could silently fail.

5. **P3 — `diff.patch` committed to repo** (root `diff.patch`, 2425 lines). A large patch file was committed and is not in `.gitignore`. This appears to be build/debug artifact.

6. **P3 — `voiceSrcValues` global/LFO slots never cleared between voices**  (`synth-processor.ts:116,374-378`). The `voiceSrcValues` Float64Array is shared across all voices and only writes slots for `ampEnv`, `filterEnv`, `velocity` per voice. The LFO/aftertouch/modWheel/pitchBend slots retain stale values from `modSourceValues` initialization or remain zero. This is currently safe because the per-voice route filter (lines 387-391) prevents reading those slots, but any future expansion that adds per-voice routes for other sources would silently read stale data.

7. **P3 — `isPerVoiceSource` is defined but never used** (`modulation-types.ts:30-32`). The function and `PER_VOICE_SOURCES` set are exported but never referenced anywhere in the codebase. The per-voice vs global distinction is hardcoded via `SOURCE_INDEX` comparisons in the processor instead.
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

1. **Missing Tests (P1):** The implementer added new functionality (the `toggleRouteBipolar` action to the modulation store and session persistence serialization for modulation) but did not add any tests for them. Additionally, the previous review's findings regarding missing tests for `setModRoutes`/`setModSource` message handling, per-voice `voiceSrcValues` routing, UI drag cancellation, and session serialization round-trip remain unaddressed.

2. **`routeCounter` Non-Determinism (P3):** In `src/audio/synth/modulation-types.ts`, `routeCounter` still uses a module-level mutable state combined with `Date.now()`. As flagged in the previous review, this is non-deterministic and can break snapshot testing. A crypto-based UUID or a simple incrementing counter without `Date.now()` should be used.

3. **SVG `<line>` Percentage Usage (P3):** In `src/ui/synth/ModulationMatrix.tsx`, the cable visualization still uses `x2="100%"`. As noted in the previous review, SVG `<line>` coordinates do not universally support percentage values in all rendering contexts. Using `getBoundingClientRect` or a `viewBox` coordinate system is preferred.

*(Note: The "No Wiring Between Store Changes and Worklet" issue flagged in the prior review cycle was correctly skipped, as `createSynthInstrument` is not instantiated anywhere in the project yet, leaving no active instrument to which `setModRoutes` could be wired.)*
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
