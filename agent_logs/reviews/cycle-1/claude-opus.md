REVIEW_CHANGES_REQUESTED

**1. P1 — Allpass filter topology is incorrect, causes up to 5x gain boost**
`src/audio/effects/freeverb.ts:156` — The feedforward path connects `prevNode` (raw input `x[n]`) instead of the delay line's input sum (`v[n]`). This makes the 4 "allpass" stages NOT true allpass filters. The magnitude response ranges from 1.17x to 1.5x per stage (with g=0.5), meaning 4 cascaded stages produce between ~1.85x and **~5x gain** depending on frequency. This will cause audible frequency coloring and potential clipping.

Fix: Add an explicit sum node for the allpass and connect feedforward to it:
```typescript
const sum = ctx.createGain();
prevNode.connect(sum);           // x[n] -> sum
sum.connect(delay);              // sum -> delay (creates v[n-M])
delay.connect(feedback);         // v[n-M] * g
feedback.connect(sum);           // g*v[n-M] -> sum (now sum = v[n])
sum.connect(feedforward);        // -g * v[n] (correct!)
feedforward.connect(apOutput);
delay.connect(apOutput);         // + v[n-M]
```

**2. P2 — `width` parameter is a no-op exposed as UI control**
`src/audio/effects/freeverb.ts:204-205` — The "Width" parameter (0-100%) is defined in the schema and visible in the UI, but the `applyParam` handler does nothing with it (`break` with a comment about "potential stereo processing"). Users see a knob that has zero effect. Either implement stereo width or remove the parameter until implemented.

**3. P3 — `replaceInsert` disconnects output but not input of old insert**
`src/audio/mixer/insert-chain.ts:87-89` — Only `old.output.disconnect()` is called; `old.input.disconnect()` is skipped. Currently safe because the bridge calls `dispose()` on the effect first, but the chain should be self-contained. Minor since `rewire()` re-routes all connections anyway.
