REVIEW_CHANGES_REQUESTED

**1. [P1] Scheduler never called — automation playback is dead code**

`createAutomationScheduler` / `scheduleWindow` has zero callers outside its own test file. The entire audio-side of E16 (the feature's purpose) is unreachable at runtime. No transport or look-ahead scheduler integration exists.

**2. [P2] `addLane` permits duplicate `ParameterTarget` per track**

There is no guard preventing two "mixer.volume" lanes on the same track. If both are armed, the scheduler will call `setValueAtTime` / `linearRampToValueAtTime` on the same `AudioParam` twice per window in a single pass. Web Audio API order-of-effect within the same rendering quantum is not guaranteed, so the resulting value is undefined. Should check for an existing lane with the same `target` before creating a new one.

Location: `src/state/automation/automation-store.ts:53` (`addLane`).

**3. [P2] `cancelAll` holds stale AudioParam references, risking throws on disposed nodes**

`scheduledParams` grows monotonically — it is never pruned when a lane is removed or when its audio node is disconnected/disposed. `cancelAll()` then calls `cancelScheduledValues(0)` on every param ever encountered, including possibly-GC'd or already-disconnected AudioParams, which can throw in some browser AudioContext implementations.

Location: `src/audio/automation/automation-scheduler.ts:96–100`.

**4. [P3] Zero-length scheduling window produces redundant ramp calls**

When `windowEnd === windowStart` (can occur at transport start/seek), `stepSize = 0` and the loop schedules 4 identical `linearRampToValueAtTime` calls at the exact same time as the `setValueAtTime`. Harmless but wastes scheduling budget and indicates missing guard.

Location: `src/audio/automation/automation-scheduler.ts:86–93`.

**5. [P3] `_resetLaneCounter` / `_seedLaneCounter` exported via public index**

Both test-only functions are re-exported from `src/audio/automation/index.ts`, making them part of the module's public API. Production code can call `_resetLaneCounter()` and trigger ID collisions on subsequent lane creation. Move them to a separate `automation-types.internal.ts` or at least drop them from `index.ts`.
