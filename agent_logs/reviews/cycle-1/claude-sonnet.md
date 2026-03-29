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
