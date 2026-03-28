You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. P1 — LFO S&H: `xorshift32` produces out-of-range values**
`lfo.ts:22–28` / `lfo.ts:62–63`

`xorshift32` returns a signed int32 (JS bitwise ops coerce to signed). When divided by `2147483647` (INT_MAX), negative values produce `shValue` as low as ~-3.0 (confirmed empirically — range is approximately -2.9997 to +0.9995). With any non-zero LFO depth this causes out-of-range modulation that will clip audio or drive the filter envelope to impossible values. Fix: use `(prngState >>> 0) / 0xFFFFFFFF` (unsigned right-shift to get uint32 before dividing by `0xFFFFFFFF`).

---

**2. P1 — `allNotesOff` ignores `"stealing"` voices**
`synth-processor.ts:154–167`

The handler only transitions `"active"` voices to `"releasing"`. Voices in `"stealing"` state are left as-is. When their crossfade completes (~5ms later), `processStealFade` sets them `"active"` and calls `applyNoteOn` for the pending note — silently resurrecting notes after an all-notes-off. The condition on line 162 should also cover `"stealing"`, and the pending note fields on those voices should be cleared.

---

**3. P2 — Legato `noteOn` on a `"releasing"` voice doesn't update allocator state**
`voice-allocator.ts:143–149`

The legato "best active voice" path (`bestIdx`) returns without setting `voice.state = "active"`. If that voice was somehow in `"releasing"` state (e.g., re-used from a previous `noteOff`), the allocator still sees it as releasing. The `process()` idle-check in `synth-processor.ts:282` will call `markIdle` once the envelope transitions to idle on note-release — but more importantly, `findOldestActive` preferentially steals releasing voices first, so this voice becomes the first steal target even while it's actively playing a held legato note.

---

**4. P2 — `synth-instrument.ts` duplicates enum arrays instead of using exported constants**
`synth-instrument.ts:91–103`

`setParam` builds inline string arrays for `osc1Type`/`osc2Type`, `filterType`, and LFO shapes instead of importing and using `WAVEFORM_TYPES`, `FILTER_TYPES`, and `LFO_SHAPES` from `synth-types.ts`. If a new waveform or filter type is added to the exported constants, the `indexOf` here returns -1 silently (worklet falls back to index 0 / "saw"). These should be the imported constants.

---

**5. P2 — `crossfadeSamples` recomputed every sample in the audio hot path**
`voice-allocator.ts:197`

`Math.floor(STEAL_CROSSFADE_S * sampleRate)` is recomputed on every call to `processStealFade`, which is called once per sample (128× per quantum at typical buffer sizes). Both `STEAL_CROSSFADE_S` and `sampleRate` are constants for the lifetime of the worklet. This should be computed once in the allocator constructor or lazily on first call.

---

**6. P3 — `completedSteals.push(i)` may allocate in the zero-allocation audio path**
`voice-allocator.ts:217`

`completedSteals` is pre-allocated but uses `push()` with only `length = 0` reset, not a pre-sized fixed capacity. V8 may reallocate the backing store if it grows beyond its initial capacity. Use a pre-allocated fixed-length array with an explicit counter index to guarantee zero-allocation.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P1 — `allNotesOff` doesn't cancel stealing voices** (`synth-processor.ts:155-167`): The handler only transitions `"active"` voices to `"releasing"`. Voices in `"stealing"` state are ignored — their envelopes get released, but `processStealFade` will later complete the crossfade and call `applyNoteOn`, re-gating the envelopes. Result: notes resume playing after a panic/allNotesOff. Fix: also clear pending notes and transition stealing voices (e.g., set `pendingNote = -1` and state to `"releasing"`, or call `markIdle`).

2. **P1 — LFO S&H output exceeds [-1, 1] range** (`lfo.ts:61-62`): `xorshift32` uses signed arithmetic right shift (`>>`) so `prngState` can be negative. The normalization `(prngState / 2147483647) * 2 - 1` maps negative values to approximately [-3, -1] instead of [-1, 1]. For example, `prngState = -1073741824` yields `-2.0`. This feeds out-of-range modulation into pitch/cutoff/amplitude. Fix: use `((prngState >>> 0) / 4294967295) * 2 - 1` or simply `prngState / 2147483648`.

3. **P2 — xorshift32 uses `>>` instead of `>>>`** (`lfo.ts:26`): The standard xorshift32 PRNG uses unsigned right shift (`>>>`). Using signed shift (`>>`) propagates the sign bit, biasing the distribution and potentially degrading the period. Fix: `x ^= x >>> 17`.

4. **P2 — Biquad coefficients recomputed with trig per-sample per-voice** (`synth-processor.ts:335-341`): `computeBiquadCoeffs` calls `Math.cos` and `Math.sin` inside the per-sample, per-voice inner loop — up to 2048 trig calls per 128-sample quantum at 16 voices. The header comment in `biquad-coeffs.ts:8` claims "coefficients recomputed only when cutoff/resonance change (not per-sample)" but the code does the opposite. Consider computing coefficients once per quantum or using an SVF topology for modulation-friendly per-sample updates.

5. **P2 — No denormal/NaN guard on biquad filter output** (`biquad-coeffs.ts:103-111`): If rapid coefficient changes cause filter instability, NaN/Infinity propagates through the voice mix to the output buffer. A single NaN poisons the entire output. Add a `!isFinite(output) ? 0 : output` check or periodic denormal flush.

6. **P3 — `completedSteals.push()` in per-sample hot path** (`voice-allocator.ts:217`): The zero-allocation claim (`processStealFade` is called per-sample) is technically violated by `Array.push()`. V8 retains capacity after `length = 0`, so this is benign in practice, but a fixed-size ring buffer with a count would be more robust.

7. **P3 — Heavy `as unknown[]` casting in synth-processor.ts** (lines 129, 158, 271, 374): The voice allocator exposes `readonly Voice[]` but the processor casts through `unknown[]` to access mutable fields. Consider exposing a mutable accessor on the allocator instead of casting in the consumer.
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
Bash command parsing error detected for command: << 'EOF' > test-xorshift.js
function xorshift32(seed) {
  let x = seed;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  return x;
}
let state = 123456789;
for(let i=0; i<5; i++) {
  state = xorshift32(state);
  let sh = (state / 2147483647) * 2 - 1;
  console.log(`state: ${state}, sh: ${sh}`);
}
EOF Syntax Errors: [
  `Error node: "<< 'EOF' > test-xorshift.js\n` +
    'function xorshift32(seed) {\n' +
    '  let x = seed;\n' +
    '  x ^= x << 13;\n' +
    '  x ^= x >> 17;\n' +
    '  x ^= x << 5;\n' +
    '  return x;\n' +
    '}\n' +
    'let state = 123456789;\n' +
    'for(let i=0; i<5; i++) {\n' +
    '  state = xorshift32(state);\n' +
    '  let sh = (state / 2147483647) * 2 - 1;\n' +
    '  console.log(`state: ${state}, sh: ${sh}`);\n' +
    '}\n' +
    'EOF" at 0:0'
]
Bash command parsing error detected for command: << 'EOF' > test-tri.js
let phase = 0;
let triState = 0;
let dt = 440 / 44100;
let min = 1, max = -1;
for(let i=0; i<200; i++) {
  let sq = phase < 0.5 ? 1 : -1;
  triState = dt * sq + (1 - dt) * triState;
  phase += dt; if(phase >= 1) phase -= 1;
  if (i > 100) {
    let out = triState * 4;
    if (out < min) min = out;
    if (out > max) max = out;
  }
}
console.log(`min: ${min}, max: ${max}`);
EOF Syntax Errors: [
  'Error node: "<" at 0:0',
  'Error node: "for(let i=0; i<200; i++) {\n' +
    '  let sq = phase < 0.5 ? 1 : -1;\n' +
    '  triState = dt * sq + (1 - dt) * triState;\n' +
    '  phase += dt; if(phase >= 1) phase -= 1;\n' +
    '  if (i > 100) {\n' +
    '    let out = triState * 4;\n' +
    '    if (out < min) min = out;\n' +
    '    if (out > max) max = out;\n' +
    '  }\n' +
    '}" at 5:0'
]
Bash command parsing error detected for command: << 'EOF' > test-tri2.js
let phase = 0;
let triState = 0;
let dt = 440 / 44100;
let min = 1, max = -1;
for(let i=0; i<2000; i++) {
  let sq = phase < 0.5 ? 1 : -1;
  triState = dt * sq + (1 - dt) * triState;
  phase += dt; if(phase >= 1) phase -= 1;
  if (i > 1000) {
    let out = triState * 4;
    if (out < min) min = out;
    if (out > max) max = out;
  }
}
console.log(`min: ${min}, max: ${max}`);
EOF Syntax Errors: [
  'Error node: "<" at 0:0',
  'Error node: "for(let i=0; i<2000; i++) {\n' +
    '  let sq = phase < 0.5 ? 1 : -1;\n' +
    '  triState = dt * sq + (1 - dt) * triState;\n' +
    '  phase += dt; if(phase >= 1) phase -= 1;\n' +
    '  if (i > 1000) {\n' +
    '    let out = triState * 4;\n' +
    '    if (out < min) min = out;\n' +
    '    if (out > max) max = out;\n' +
    '  }\n' +
    '}" at 5:0'
]
REVIEW_CHANGES_REQUESTED
1. P1: Bug in `src/audio/synth/dsp/lfo.ts` sample-and-hold output range. `xorshift32` returns a signed 32-bit integer, but the scaling `(prngState / 2147483647) * 2 - 1` assumes an unsigned/positive range. This results in output values up to `[-3, 1]` instead of the required `[-1, 1]`. Use `(prngState / 2147483648)` to map the signed integer directly to `[-1, 1)`.
2. P1: Memory leak and multiple Web Audio node creation in `src/audio/effects/EffectsBridgeProvider.tsx`. The `useState` initializer calls `createEffectsBridge` and `createMixerEngine` which create AudioNodes and subscribe to Zustand (`useEffectsStore.subscribe`). In React StrictMode, the initializer is called twice, causing the discarded instances to permanently leak store subscriptions and audio nodes. Initialize these via `useEffect` or `useRef`.
3. P2: Expensive `computeBiquadCoeffs` called per-sample inside the DSP inner loop in `src/audio/synth/synth-processor.ts`. Because cutoff is modulated by the filter envelope and LFO at audio rate, filter coefficients (which use `Math.sin`/`Math.cos`) are recomputed per sample, per voice, violating the "not per-sample" comment in `biquad-coeffs.ts`. Modulated cutoff should be updated at control-rate blocks or use a fast approximation.
4. P2: Unnecessary per-sample math in `src/audio/synth/synth-processor.ts`. `Math.pow(2, p.osc1Octave)` and `Math.pow(2, p.osc1Detune / 1200)` are evaluated per sample, per voice inside the DSP inner loop. Since these are control-rate parameters, they should be precalculated outside the sample loop.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
