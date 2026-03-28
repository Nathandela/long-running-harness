You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All six findings verified:

1. **LFO S&H range** — `>>>` unsigned shift + `/2147483648` now maps to [-1, 1) (confirmed empirically: -0.999976 to +0.999976). ✓
2. **`allNotesOff` stealing** — now clears `pendingNote`/`pendingVelocity` and transitions stealing voices to "releasing". ✓
3. **Legato voice state** — on re-examination, the "best active" search on line 142 explicitly filters `voice.state === "active"`, so a releasing voice can't be returned; the state update is not needed. ✓ (false positive in my initial review)
4. **Duplicate enum arrays** — replaced with imported `WAVEFORM_TYPES`, `FILTER_TYPES`, `LFO_SHAPES`. ✓
5. **`crossfadeSamples` per-sample** — cached in `cachedCrossfadeSamples`. ✓
6. **`completedSteals.push` allocation** — replaced with pre-allocated `new Array(MAX_VOICES)` + `completedCount` index counter. ✓

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All 82 tests pass, types check clean. Mapping fixes to my original findings:

| # | Finding | Status |
|---|---------|--------|
| P1-1 | `allNotesOff` skips stealing voices | Fixed — now cancels pending steal and transitions to releasing |
| P1-2 | LFO S&H output outside [-1,1] | Fixed — `prngState / 2147483648` maps signed int32 to [-1,1) |
| P2-3 | xorshift `>>` vs `>>>` | Fixed — now uses unsigned right shift |
| P2-4 | Biquad trig per-sample | Comment corrected; octave/detune `Math.pow` hoisted out of sample loop |
| P2-5 | No NaN guard on filter | Fixed — `isFinite(output) ? output : 0` with state cleanup |
| P3-6 | `completedSteals.push()` | Fixed — pre-allocated fixed-size array with counter |
| P3-7 | `as unknown[]` casts | Cosmetic, not addressed (acceptable) |

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
REVIEW_CHANGES_REQUESTED
1. P1 (Unresolved Finding 2): Memory leak and multiple Web Audio node creation in `src/audio/effects/EffectsBridgeProvider.tsx`. The recent `setTimeout` fix in `useEffect` cleanup does not fix the StrictMode leak. React can call `useState` initializers multiple times and discard the result. The discarded `EffectsBridgeContext` instance from the initializer will never mount, its `useEffect` will never run, and thus its `bridge.dispose()` will never be called, permanently leaking the Zustand subscription and AudioNodes. Side-effectful initialization (like `createEffectsBridge`) must be moved completely inside `useEffect`.
2. P2 (Unresolved Finding 3): Expensive `computeBiquadCoeffs` is still called per-sample, per-voice, inside the DSP inner sample loop `for (let s = 0; s < numSamples; s++)` in `src/audio/synth/synth-processor.ts`. This evaluates `Math.sin`/`Math.cos` per-sample. Modulated cutoff should either be computed at control-rate (once per block of samples) or use a fast polynomial approximation instead of exact trig functions if evaluated at audio rate.
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] The effects bridge still breaks the existing `App`/`DawShell` render path in tests** ([DawShell.tsx:88](/Users/Nathan/Documents/Code/long-running-harness/src/ui/DawShell.tsx:88), [EffectsBridgeProvider.tsx:28](/Users/Nathan/Documents/Code/long-running-harness/src/audio/effects/EffectsBridgeProvider.tsx:28), [mixer-engine.ts:34](/Users/Nathan/Documents/Code/long-running-harness/src/audio/mixer/mixer-engine.ts:34))  
  `pnpm lint` is clean enough now, but `pnpm test` still fails in `App.test.tsx` and `DawShell.test.tsx`. `DawShell` still unconditionally mounts `EffectsBridgeProvider`, and that provider eagerly constructs a real mixer from the audio engine context. That makes `DawShell` no longer renderable in isolation and also forces the `App` test `MockAudioContext` to implement `createDynamicsCompressor()` and the rest of the mixer graph APIs. Either move this provider requirement out of `DawShell`, or update the tests and test doubles to satisfy the new contract.

- **[P1] The bypass smoothing change still violates the current effect contract** ([create-effect.ts:75](/Users/Nathan/Documents/Code/long-running-harness/src/audio/effects/create-effect.ts:75), [effects.test.ts:134](/Users/Nathan/Documents/Code/long-running-harness/src/audio/effects/effects.test.ts:134))  
  All six `bypass toggles correctly` tests still fail because `setBypassed()` now schedules ramps but no longer makes `dryGain.gain.value` and `wetGain.gain.value` reflect the new state synchronously. If the ramped behavior is intended, the tests and any synchronous callers need to be updated to a new contract; otherwise the implementation needs to preserve the immediate observable state while still smoothing the audio transition.

- **[P1] Session hydration still leaves stale effects behind when the loaded session has none** ([use-session-persistence.ts:50](/Users/Nathan/Documents/Code/long-running-harness/src/state/session/use-session-persistence.ts:50), [use-session-persistence.ts:75](/Users/Nathan/Documents/Code/long-running-harness/src/state/session/use-session-persistence.ts:75))  
  This regression is still present. `storeToSession()` omits `effects` when there are no slots, but `hydrateStore()` only writes `trackEffects` when `session.effects` exists. Loading a blank/new session after one with inserts therefore preserves the old effects map and can re-save ghost inserts on the next autosave. Clear `trackEffects` on every hydrate, not only when `session.effects` is present.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
