REVIEW_CHANGES_REQUESTED

1. **P1 - No duplicate lane target guard**: `addLane` in `automation-store.ts:53` allows adding multiple lanes for the same track+target pair (e.g., two volume lanes for track-1). This will cause the scheduler to double-schedule AudioParam values, producing incorrect output. Add a guard that rejects or replaces a lane if one already exists for the same target on that track.

2. **P2 - `movePoint` and `addPoint` don't clamp value to 0..1 or time to >= 0**: The Zod schema validates on persistence, but the store methods (`automation-store.ts:97`, `automation-store.ts:129`) accept any `number` for time and value at runtime. A caller passing `newValue: -0.5` or `newTime: -1` would create invalid state that persists until the next save/load cycle catches it. Clamp `value` to `[0, 1]` and `time` to `>= 0` in the pure functions (`insertPoint`, `movePoint` in `automation-curve.ts`).

3. **P2 - Module-level mutable `laneCounter` is not safe across concurrent test suites or SSR**: `automation-types.ts:59` uses a module-level `let laneCounter`. This is the same pattern as the existing `routeCounter` so it's consistent, but any future parallel test runner or SSR context will collide. Flagging for awareness; no immediate fix needed if this is an accepted pattern.

4. **P2 - `cancelScheduledValues(windowStart)` may truncate in-progress ramps**: In `automation-scheduler.ts:78`, cancelling from `windowStart` before setting the new start value can cause a brief jump to the last committed value on the AudioParam before the new `setValueAtTime` takes effect. The Web Audio spec applies `cancelScheduledValues` immediately. Consider using `cancelAndHoldAtTime(windowStart)` instead (available in all modern browsers) to avoid audible glitches at window boundaries.

5. **P3 - `scheduledParams` Set grows unbounded**: In `automation-scheduler.ts:57`, `scheduledParams` accumulates every resolved param across all `scheduleWindow` calls and only clears on `cancelAll`. If lanes are reconfigured over a long session, stale param references will accumulate. Minor memory leak; consider clearing per-window or using a WeakSet.

6. **P3 - `insertPoint` is O(n) linear scan**: `automation-curve.ts:94` uses `findIndex` for insertion. `evaluateCurve` uses binary search for lookup. For consistency and performance with many points, `insertPoint` could also use binary search. Low priority since point arrays are typically small.
