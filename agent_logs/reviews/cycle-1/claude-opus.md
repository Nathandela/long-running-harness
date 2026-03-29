REVIEW_CHANGES_REQUESTED

1. **P1 - Multi-delete undo is not atomic.** `onKeyDown` pushes one `RemoveClipCommand`/`RemoveTrackCommand` per selected item. Undoing requires N separate undo actions to restore N items. Users expect a single Ctrl+Z to undo a batch delete. Wrap multiple commands in a `CompositeCommand` (or equivalent batch undo) and push once.

   `src/ui/arrangement/use-arrangement-interactions.ts:170-186`

2. **P2 - MIDI clip trim doesn't adjust `noteEvents`.** When trimming a MIDI clip's start, `startTime` advances but `noteEvents[].startTime` values remain relative to the original start. Notes that now fall outside `[0, duration)` should be removed or clipped, and if the left edge moves, note start times should shift so they remain correct relative to the new clip start. Currently notes will play at wrong times or outside the visible clip.

   `src/state/store.ts:342-362`

3. **P2 - No confirmation on track delete button click.** A single click on the tiny 16x16 delete button permanently removes a track and all its clips. Accidental clicks are easy, especially on a dense arrangement. Consider requiring a modifier key, double-click, or a brief confirm tooltip. The undo path exists, but accidental track deletion is disruptive.

   `src/ui/arrangement/use-arrangement-interactions.ts:158-162`

4. **P2 - `onCommitToTimeline` iterates trigger keys with unsafe cast.** `Object.keys(step.triggers) as DrumInstrumentId[]` is not type-safe if `triggers` ever contains unexpected keys. Additionally, the step type check `if (!step.triggers[instId]) continue` doesn't distinguish between `false` and `undefined` -- both are falsy, so this works, but the `as` cast is a maintenance risk.

   `src/ui/panels.tsx:167`

5. **P3 - Orphaned comment.** The line `// mapPitchToDrum imported from @audio/drum-machine/drum-types` restates the import above it and adds no value. Remove it.

   `src/audio/bounce/bounce-engine.ts:364`
