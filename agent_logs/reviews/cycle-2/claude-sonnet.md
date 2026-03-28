All four findings are resolved:

1. **P2 sampleRate** — fixed, now uses `ctx.sampleRate` (lines 125, 154)
2. **P2 width no-op** — fixed, parameter removed entirely; damping upgraded to a proper BiquadFilter lowpass in the feedback loop
3. **P3 A/B param reset** — fixed, `mix` is now preserved across swap
4. **P3 replaceInsert fallback** — fixed, throws with a descriptive message; test updated to assert the throw

REVIEW_APPROVED
