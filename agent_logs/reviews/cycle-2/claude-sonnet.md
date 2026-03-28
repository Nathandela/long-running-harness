Checking the applied fixes against my 5 findings:

1. **P1 — `disconnectFromMixer`**: Now calls `output.disconnect(strip.inputGain)` — fixed.
2. **P1 — `activeOH` stale on natural decay**: "ended" handler now clears `activeOH`/`activeOHFlam` by identity check — fixed.
3. **P2 — Dead `onSetFlam` prop**: Removed from props type, component destructuring, and tests — fixed.
4. **P2 — Velocity clamping**: `Math.max(0.001, p.volume * Math.min(1, velocity))` — fixed (also guards against zero gain for exponentialRamp).
5. **P2 — Hardcoded knob ranges**: Now reads from `PARAM_RANGES` — fixed.

REVIEW_APPROVED
