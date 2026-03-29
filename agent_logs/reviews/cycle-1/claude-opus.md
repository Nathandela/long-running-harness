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
