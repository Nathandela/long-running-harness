All checks pass. Here's the complete summary of all fixes across both commits:

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | P0 | Chorus oscillator never stopped on dispose | **Fixed** - `lfo.stop()` in disposeChain |
| 2 | P0 | Reverb `createDelay(0.1)` zero headroom | **Fixed** - bumped to `0.15` |
| 6 | P1 | All effect-internal nodes leaked on dispose | **Fixed** - disposeChain callback in all 6 effects |
| 3 | P1 | No state-to-audio bridge | Skipped - acknowledged deferred work (out of scope for this epic) |
| 4 | P1 | Blanket `disconnect()` in insert-chain | Skipped - safe in current usage (inputGain only connects through chain) |
| 5 | P1 | Reverb IR generation blocks main thread | Skipped - performance optimization, not a correctness bug |
| 7 | P2 | EffectsRack subscribes to entire trackEffects | **Fixed** - narrowed selector to per-track |
| 11 | P3 | Unused `unit` prop in ParamKnob | **Fixed** - removed dead prop |

677/677 tests pass. TypeScript, ESLint, Prettier all clean.

FIXES_APPLIED
