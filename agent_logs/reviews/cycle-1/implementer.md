Committed successfully. Here's a summary of all fixes applied:

FIXES_APPLIED

## P1 Fixes
1. **Modulation bridge** (`modulation-bridge.ts`): Created `subscribeModRoutes(trackId, instrument)` that subscribes to the Zustand store and forwards `WorkletModRoute[]` to the `SynthInstrument` whenever routes change. Returns unsubscribe function for cleanup.
2. **Missing tests**: Added tests for `toggleRouteBipolar`, session modulation round-trip hydration, `MAX_MOD_ROUTES` enforcement on load, drag cancellation via document mouseup, and bridge subscribe/unsubscribe lifecycle.

## P2 Fixes
3. **Drag state leak** (`ModulationMatrix.tsx`): Added `document`-level `mouseup` listener via `useEffect` so drag state clears even when mouse released outside the component.
4. **Session hydration type safety** (`use-session-persistence.ts`): Typed matrices with `ModulationStore['matrices']` instead of `source: string`. Zod schema already validates enum values at runtime.
5. **MAX_MOD_ROUTES on load**: `hydrateStore` now calls `routes.slice(0, MAX_MOD_ROUTES)` before `setState`, preventing unbounded routes from crafted sessions.
6. **routeCounter determinism** (`modulation-types.ts`): Removed `Date.now()` from route IDs (counter alone is sufficient). Added `_resetRouteCounter()` for deterministic tests.
7. **Filter coefficient trade-off**: Documented the intentional per-block recomputation in `synth-processor.ts` with rationale.

## P3 Fixes
8. **Dead code removed**: Replaced `isPerVoiceSource()` function with exported `PER_VOICE_SOURCES` set (the function was never called; the set is the useful primitive).
9. **Diff artifacts**: Added `*.patch` and `diff.txt` to `.gitignore`.

**Results**: 101 test files, 1049 tests passing. TypeScript and ESLint clean.
