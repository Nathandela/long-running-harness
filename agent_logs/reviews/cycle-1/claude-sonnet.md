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
