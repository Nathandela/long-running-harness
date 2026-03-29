You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
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
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P1 - No duplicate lane target guard**: `addLane` in `automation-store.ts:53` allows adding multiple lanes for the same track+target pair (e.g., two volume lanes for track-1). This will cause the scheduler to double-schedule AudioParam values, producing incorrect output. Add a guard that rejects or replaces a lane if one already exists for the same target on that track.

2. **P2 - `movePoint` and `addPoint` don't clamp value to 0..1 or time to >= 0**: The Zod schema validates on persistence, but the store methods (`automation-store.ts:97`, `automation-store.ts:129`) accept any `number` for time and value at runtime. A caller passing `newValue: -0.5` or `newTime: -1` would create invalid state that persists until the next save/load cycle catches it. Clamp `value` to `[0, 1]` and `time` to `>= 0` in the pure functions (`insertPoint`, `movePoint` in `automation-curve.ts`).

3. **P2 - Module-level mutable `laneCounter` is not safe across concurrent test suites or SSR**: `automation-types.ts:59` uses a module-level `let laneCounter`. This is the same pattern as the existing `routeCounter` so it's consistent, but any future parallel test runner or SSR context will collide. Flagging for awareness; no immediate fix needed if this is an accepted pattern.

4. **P2 - `cancelScheduledValues(windowStart)` may truncate in-progress ramps**: In `automation-scheduler.ts:78`, cancelling from `windowStart` before setting the new start value can cause a brief jump to the last committed value on the AudioParam before the new `setValueAtTime` takes effect. The Web Audio spec applies `cancelScheduledValues` immediately. Consider using `cancelAndHoldAtTime(windowStart)` instead (available in all modern browsers) to avoid audible glitches at window boundaries.

5. **P3 - `scheduledParams` Set grows unbounded**: In `automation-scheduler.ts:57`, `scheduledParams` accumulates every resolved param across all `scheduleWindow` calls and only clears on `cancelAll`. If lanes are reconfigured over a long session, stale param references will accumulate. Minor memory leak; consider clearing per-window or using a WeakSet.

6. **P3 - `insertPoint` is O(n) linear scan**: `automation-curve.ts:94` uses `findIndex` for insertion. `evaluateCurve` uses binary search for lookup. For consistency and performance with many points, `insertPoint` could also use binary search. Low priority since point arrays are typically small.
</claude-opus-review>

<gemini-review>
YOLO mode is enabled. All tool calls will be automatically approved.
YOLO mode is enabled. All tool calls will be automatically approved.
[MCP error] Error during discovery for MCP server 'playwright': MCP error -32000: Connection closed McpError: MCP error -32000: Connection closed
    at McpError.fromError (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/types.js:2035:16)
    at Client._onclose (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js:259:32)
    at _transport.onclose (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js:223:18)
    at ChildProcess.<anonymous> (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js:85:31)
    at ChildProcess.emit (node:events:518:28)
    at maybeClose (node:internal/child_process:1101:16)
    at ChildProcess._handle.onexit (node:internal/child_process:304:5) {
  code: -32000,
  data: undefined
}
MCP issues detected. Run /mcp list for status.Scheduling MCP context refresh...
Executing MCP context refresh...
MCP context refresh complete.
Error executing tool read_file: Path not in workspace: Attempted path "/tmp/src-diff.txt" resolves outside the allowed workspace directories: /Users/Nathan/Documents/Code/long-running-harness or the project temp directory: /Users/Nathan/.gemini/tmp/long-running-harness
REVIEW_CHANGES_REQUESTED

1. **P1 - Scheduler misses fast automation (Fixed-step sampling):** In `automation-scheduler.ts`, `scheduleWindow` samples the evaluated curve using a hardcoded `SCHEDULE_STEPS = 4`. By blindly sampling the curve at fixed intervals, the scheduler effectively downsamples the automation control rate. Sharp transients or rapid automation spikes (like a rhythmic volume gate) falling between these step intervals will be completely skipped or improperly slurred. To achieve the intended sample-accurate playback, the scheduler must iterate over the actual `lane.points` that fall within the `[arrStart, arrEnd]` window and place Web Audio API events at those exact breakpoint times (in addition to handling window boundaries for continuity).

2. **P2 - Memory leak in `scheduledParams`:** In `automation-scheduler.ts`, the `scheduledParams` Set retains strong references to every automated `AudioParam`. If a user deletes an effect or a track while the transport is running, its corresponding `AudioParam` remains in this Set. This prevents the underlying AudioNodes from being garbage collected until `cancelAll()` is called (typically when the transport stops). Consider adding an unregister mechanism (e.g., `unscheduleParam`) or pruning unreferenced parameters during the scheduling tick.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
