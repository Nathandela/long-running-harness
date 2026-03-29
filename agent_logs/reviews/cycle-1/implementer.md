All 1474 tests pass. Here's the summary of all fixes applied:

**P2 (all fixed):**
1. **Drum pattern lost on track switch** — Hoisted sequencer to module-level `Map<trackId, StepSequencer>` cache so patterns persist across unmount/remount
2. **Missing `key` on DrumMachineController** — Added `key={selectedTrack.id}` to prevent state bleed between drum tracks
3. **Missing `aria-haspopup`/`aria-expanded`** — Added both attributes to the Add Track button
4. **Escape key doesn't close dropdown** — Added `keydown` listener for Escape alongside the existing `mousedown` handler

**P3 (all addressed):**
5. **Hardcoded `% 16`** — Changed to `% pattern.steps.length`
6. **`onTriggerPad` no-op** — Added `// TODO: wire to audio engine for pad preview`
7. **`onParamChange` local-only** — Added `// TODO: propagate param changes to audio engine`
8. **Missing instrument track test** — Added test asserting SynthEditor renders for `type: "instrument"`
9. **Track naming collisions** — Replaced `.length` counting with max-number extraction from existing track names

FIXES_APPLIED
