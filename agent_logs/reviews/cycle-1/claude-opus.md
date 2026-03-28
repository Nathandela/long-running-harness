REVIEW_CHANGES_REQUESTED

1. **P1 — `allNotesOff` doesn't cancel stealing voices** (`synth-processor.ts:155-167`): The handler only transitions `"active"` voices to `"releasing"`. Voices in `"stealing"` state are ignored — their envelopes get released, but `processStealFade` will later complete the crossfade and call `applyNoteOn`, re-gating the envelopes. Result: notes resume playing after a panic/allNotesOff. Fix: also clear pending notes and transition stealing voices (e.g., set `pendingNote = -1` and state to `"releasing"`, or call `markIdle`).

2. **P1 — LFO S&H output exceeds [-1, 1] range** (`lfo.ts:61-62`): `xorshift32` uses signed arithmetic right shift (`>>`) so `prngState` can be negative. The normalization `(prngState / 2147483647) * 2 - 1` maps negative values to approximately [-3, -1] instead of [-1, 1]. For example, `prngState = -1073741824` yields `-2.0`. This feeds out-of-range modulation into pitch/cutoff/amplitude. Fix: use `((prngState >>> 0) / 4294967295) * 2 - 1` or simply `prngState / 2147483648`.

3. **P2 — xorshift32 uses `>>` instead of `>>>`** (`lfo.ts:26`): The standard xorshift32 PRNG uses unsigned right shift (`>>>`). Using signed shift (`>>`) propagates the sign bit, biasing the distribution and potentially degrading the period. Fix: `x ^= x >>> 17`.

4. **P2 — Biquad coefficients recomputed with trig per-sample per-voice** (`synth-processor.ts:335-341`): `computeBiquadCoeffs` calls `Math.cos` and `Math.sin` inside the per-sample, per-voice inner loop — up to 2048 trig calls per 128-sample quantum at 16 voices. The header comment in `biquad-coeffs.ts:8` claims "coefficients recomputed only when cutoff/resonance change (not per-sample)" but the code does the opposite. Consider computing coefficients once per quantum or using an SVF topology for modulation-friendly per-sample updates.

5. **P2 — No denormal/NaN guard on biquad filter output** (`biquad-coeffs.ts:103-111`): If rapid coefficient changes cause filter instability, NaN/Infinity propagates through the voice mix to the output buffer. A single NaN poisons the entire output. Add a `!isFinite(output) ? 0 : output` check or periodic denormal flush.

6. **P3 — `completedSteals.push()` in per-sample hot path** (`voice-allocator.ts:217`): The zero-allocation claim (`processStealFade` is called per-sample) is technically violated by `Array.push()`. V8 retains capacity after `length = 0`, so this is benign in practice, but a fixed-size ring buffer with a count would be more robust.

7. **P3 — Heavy `as unknown[]` casting in synth-processor.ts** (lines 129, 158, 271, 374): The voice allocator exposes `readonly Voice[]` but the processor casts through `unknown[]` to access mutable fields. Consider exposing a mutable accessor on the allocator instead of casting in the consumer.
