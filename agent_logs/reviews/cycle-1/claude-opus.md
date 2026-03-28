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
