REVIEW_CHANGES_REQUESTED

**1. P1 — `disconnectFromMixer` severs all output connections** (`drum-kit.ts:134-136`)

`output.disconnect()` disconnects from every destination, not just the target strip. The `_mixer` and `_trackId` parameters are ignored. Should be `output.disconnect(strip.inputGain)` using the specific strip. As-is, calling this in any multi-connection scenario silently breaks all routing. Also identical to `dispose()`.

**2. P1 — `activeOH` not cleared when OH decays naturally** (`drum-kit.ts:78-83`)

The `"ended"` event handler disconnects nodes but never sets `activeOH = null`. After OH finishes its natural decay, `activeOH` holds a stale reference to disconnected nodes. Subsequent CH triggers enter the try/catch, `setValueAtTime` on the dead gain node doesn't throw and silently no-ops, but `activeOH` is only nulled in the CH handler — so repeated CH triggers after natural OH decay each operate on the stale voice until a new OH fires. Fix: set `activeOH = null` inside the "ended" callback when `instrumentId === "oh"`.

**3. P2 — `onSetFlam` prop declared but never used** (`DrumMachinePanel.tsx:23`)

`onSetFlam` is in `DrumMachinePanelProps` and destructured in the component but no UI element calls it. Flam is fully wired in the sequencer but unreachable from the panel. Either add flam UI or remove the dead prop.

**4. P2 — Velocity not clamped at engine boundary** (`drum-kit.ts:65`)

`peakGain = p.volume * velocity` — if a caller passes `velocity > 1`, peak gain exceeds 1. No validation in `trigger()`. Add a `Math.min(1, velocity)` clamp or at minimum document the valid range.

**5. P2 — Knob ranges hardcoded instead of reading from `PARAM_RANGES`** (`DrumMachinePanel.tsx:146-182`)

`min`/`max` values for Tone/Decay/Tune/Vol knobs are hardcoded literals that duplicate `PARAM_RANGES`. Silent divergence risk. Should derive from `PARAM_RANGES[key]`.
