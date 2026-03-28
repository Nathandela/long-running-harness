REVIEW_CHANGES_REQUESTED

**1. P2 — Hardcoded sample rate in `freeverb.ts:132,154`**

```ts
const delayTime = delaySamples / 44100;  // wrong on 48kHz systems
```

`ctx.sampleRate` should be used instead of the literal `44100`. On 48kHz contexts (common on Windows, some Linux setups) all delay times are 8% shorter than intended, noticeably shifting the reverb character. `reverb.ts:43` uses `ctx.sampleRate` correctly.

---

**2. P2 — `width` parameter is a no-op but exposed in UI**

`freeverb.ts:217-219` — the `width` case in `applyParam` is an empty stub with a "potential future use" comment. The UI renders a fully interactive Width knob that controls nothing. Either implement it or remove the parameter so the UI doesn't mislead users.

---

**3. P3 — A/B swap silently resets all parameters to defaults**

`EffectsRack.tsx:handleSwapReverb` resets to `p.default` for every parameter on swap. If the user has dialed in a convolution reverb's mix/decay and hits A/B, those settings are discarded. The feature is called "A/B comparison" which implies preserving comparable settings. At minimum the `mix` value should be carried over.

---

**4. P3 — `replaceInsert` fallback-to-append is a silent error path**

`insert-chain.ts:83-86` — when the insert ID is not found, `replaceInsert` falls back to appending. This is the only caller path that could hit this (a type-swap on a slot already in the chain), so a missing ID indicates a logic error in the bridge. The fallback masks the bug; it should throw or at least warn, consistent with how `at()` is used elsewhere in the same file.
