All checks pass. Committed as `e1258eb`.

**FIXES_APPLIED**

Here's what was fixed:

| Sev | Finding | Fix |
|-----|---------|-----|
| P0 | Time coordinate mismatch in clip-scheduler | Added `timeOffset` param; all scheduling uses AudioContext time |
| P0 | Mid-clip seeking ignored | Changed to overlap check; computes `seekOffset` and adjusted `sourceOffset` |
| P1 | `cleanup()` destroys active clips | Now checks `entry.endTime <= ctx.currentTime` before disconnecting |
| P1 | `setSolo()`/`setSoloIsolate()` don't apply state | Both now call `updateSoloState()` internally |
| P1 | Looping clip re-schedule blocked | `ended` listener checks `current === entry` before removing |
| P2 | Fade overlap causes glitched gain | Clamp `fadeIn`/`fadeOut` so they don't exceed `duration` |
| P2 | MixerPanel callbacks re-render all strips | Use `useDawStore.getState()` instead of closing over `tracks` |
| P3 | `volumeToDb` duplicated | Extracted to `src/ui/mixer/format.ts` |
| P3 | `logarithmicTaper` misnamed | Renamed to `faderTaper` with corrected doc comment |
| P3 | `RoutingGraph` dead code unclear | Added `/** Used by E13 */` comment on index export |
