All 1285 tests pass across 115 files.

FIXES_APPLIED

**Summary of what was fixed:**

| Review | Finding | Fix |
|--------|---------|-----|
| Codex P1 | Automation playback not wired to real AudioParams - `paramResolverRef` defaults to `() => undefined` with no call site | Created `createParamResolver()` that maps mixer volume → `faderGain.gain` and pan → `panner.pan`. Wired it from `EffectsBridgeProvider` (which owns the mixer) into the transport via `setParamResolver()`. |

**Files changed:**
- `src/audio/automation/create-param-resolver.ts` - New resolver mapping lane targets to live AudioParams
- `src/audio/automation/create-param-resolver.test.ts` - 6 tests covering volume, pan, missing track, unsupported targets
- `src/audio/effects/EffectsBridgeProvider.tsx` - Calls `setParamResolver()` on mount to wire the resolver

**Note:** Effect and synth param targets return `undefined` for now since `EffectInstance` doesn't expose raw AudioParams (it uses `setParam()` internally). This would require exposing AudioParams from the effect/synth layer for sample-accurate automation scheduling.
