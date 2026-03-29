You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. [P2] `synth-renderer.ts:194` — Filter produces silence for voices allocated between coefficient update cycles**

The inner loop recomputes biquad coefficients only at `s % 128 === 0`. `createBiquadCoeffs()` initializes with `{ b0: 0, ..., a0: 1 }`, so `process(input)` returns `(0 * input) / 1 = 0`. Any voice allocated at samples 1–127, 129–255, etc. renders silence until the next 128-sample boundary. For reused voices, stale coefficients from the previous note are used during the same window. Fix: call `computeBiquadCoeffs(...)` inside `allocateNoteOn` immediately after resetting.

---

**2. [P2] `synth-renderer.ts:150–156` — LFO computed but discarded in the hot render loop**

```ts
const lfo1Val = lfo1.process(params.lfo1Rate, sampleRate) * params.lfo1Depth;
const lfo2Val = lfo2.process(params.lfo2Rate, sampleRate) * params.lfo2Depth;
void lfo1Val;
void lfo2Val;
```

`lfo.process()` advances the LFO phase state every sample with a `Math.sin` call — this is CPU work in the innermost loop that produces zero effect. Either remove the LFO processing entirely (since it's unimplemented) or move it outside the `s` loop if only used for coefficient modulation.

---

**3. [P2] `bounce-engine.ts` — `cancelFlag` shared state between concurrent `bounce()` calls**

The cancel flag is reset to `false` at the start of every `bounce()` call. If a consumer starts a new bounce before fully draining/discarding the previous generator, the new call clears the cancel flag for the still-live old generator. The `BounceEngine` type and factory have no documentation of the single-concurrent-use assumption. At minimum, add a comment or throw if `bounce()` is called while another generator is active.

---

**4. [P3] `bounce-engine.ts:456` — `WAV_CHUNK_SAMPLES` comment misleading for non-44100 Hz sessions**

```ts
const WAV_CHUNK_SAMPLES = 30 * 44100; // ~30 seconds per encoding chunk
```

The sample count is correct for chunking, but the comment is only accurate at 44100 Hz. At 48000 Hz it produces ~27.5-second chunks. Minor, but could confuse when debugging 48 kHz exports.

---

**5. [P3] `bounce-engine.ts:444–452` — Non-mixer automation silently skipped with no comment**

`resolveOfflineParam` returns `undefined` for any target type other than "mixer". If a session has armed synth-parameter or drum-parameter automation lanes, they are silently ignored during bounce with no log or warning. Add a comment at the call site noting that only mixer volume/pan automation is applied offline.

---

**6. [P3] `wav-encoder.ts:37,49` — IEEE float WAV fmt chunk may trip strict parsers**

Format code 3 (`WAVE_FORMAT_IEEE_FLOAT`) with a 16-byte fmt chunk is technically non-conformant; the spec recommends an 18-byte chunk with `cbSize=0` for non-PCM formats. Most decoders handle 16-byte fine, but some strict parsers or embedded hardware reject it. Low risk for a DAW export, but worth noting.
</claude-sonnet-review>

<claude-opus-review>
All 1323 tests pass, no regressions. TypeScript compiles cleanly.

REVIEW_CHANGES_REQUESTED

1. **P2 — LFO modulation discarded in synth-renderer, causing live/bounce divergence** (`src/audio/bounce/synth-renderer.ts:150-156`). `lfo1Val` and `lfo2Val` are computed then explicitly voided. Any session using LFO modulation on pitch/filter/amp will render differently offline vs. live. Either wire the LFO outputs to the corresponding modulation targets (matching `SynthProcessor`) or document this as a known limitation and surface a warning to the user when bouncing tracks with active LFO modulation.

2. **P2 — `WAV_CHUNK_SAMPLES` hardcoded to 44100** (`src/audio/bounce/bounce-engine.ts:456`). The constant `30 * 44100` means chunks are ~30s at 44.1kHz but ~27.6s at 48kHz and ~13.8s at 96kHz. Should be computed from the actual `sampleRate` parameter:
   ```ts
   const chunkSamples = 30 * sampleRate;
   ```
   The current code works but contradicts the intent (fixed time per chunk) and would allocate fewer/smaller chunks at higher sample rates for no reason.

3. **P2 — Cancellation cannot interrupt `OfflineAudioContext.startRendering()`** (`src/audio/bounce/bounce-engine.ts:612`). The `await ctx.startRendering()` blocks until the entire offline render completes. For a 10-minute session at 96kHz this could be substantial. The `isCancelled()` checks only run at yield boundaries — but the longest gap is the full render. Consider using `ctx.suspend()`/`ctx.resume()` with periodic cancellation checks, or at minimum document this limitation.

4. **P3 — `mapPitchToDrum` re-creates lookup object on every call** (`src/audio/bounce/bounce-engine.ts:366-387`). This is called once per drum hit event. For dense drum patterns the object literal is allocated and GC'd repeatedly. Hoist the `map` to module scope as a `const`.

5. **P3 — `faderTaper` not exported from module index** (`src/audio/mixer/fader-taper.ts`). The bounce engine imports `faderTaper` via `@audio/mixer/fader-taper` (deep import) rather than through the mixer barrel export. This bypasses the module boundary. Either add it to `@audio/mixer/index.ts` and import from there, or verify this is intentional given project import-boundary lint rules.

6. **P3 — No validation on `BounceOptions.sampleRate`/`bitDepth`** (`src/audio/bounce/bounce-engine.ts:501`). Passing `sampleRate: 0` or a negative value would create an `OfflineAudioContext` with invalid parameters and throw an opaque browser error. A guard at the boundary (`if (sampleRate <= 0) throw ...`) would produce a clearer error message.
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


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
