All 985 tests pass, TypeScript compiles clean. Here's the review:

REVIEW_CHANGES_REQUESTED

1. **P1 -- MoveNoteCommand sentinel value 0 conflates "unset" with valid position** (`src/state/track/midi-commands.ts:80`). The guard `this.oldStartTime === 0 && this.oldPitch === 0` uses 0 as a sentinel for "not yet captured." But pitch 0 (C-1) at startTime 0 is a valid note position. If a note starts at (0, 0), `execute()` re-reads the store on every call instead of using the original values, corrupting undo after any intermediate state change. Fix: use `undefined | number` for `oldStartTime`/`oldPitch` and check `=== undefined`, or a boolean `captured` flag. Same pattern exists in `ResizeNoteCommand:132` (mitigated by min duration 0.01, but still fragile).

2. **P2 -- Left-edge resize drag behaves identically to right-edge** (`src/ui/piano-roll/use-piano-roll-interactions.ts:193-206`). Both `note-left-edge` and `note-right-edge` hit results start the same `resize-note` drag that only changes `duration`. Dragging the left edge should move `startTime` earlier/later and adjust `duration` inversely (keeping the right edge fixed). Currently left-edge drag is indistinguishable from right-edge drag.

3. **P2 -- Pencil draw-note redo restores initial grid-snap size, not final dragged size** (`src/ui/piano-roll/use-piano-roll-interactions.ts:144-157`). On pointerDown, `AddNoteCommand` is pushed with the initial one-grid-step duration. During drag, `resizeNoteEvent` is called directly on the store (no command). On pointerUp, no resize command is pushed. Undo correctly removes the note, but redo re-adds it at the initial small size, discarding the user's drag extension.

4. **P2 -- `handleWheel` `preventDefault()` is a no-op** (`src/ui/piano-roll/PianoRollEditor.tsx:206`). React 17+ attaches wheel listeners as passive by default. `e.preventDefault()` on a passive listener is ignored (and logs a console warning in some browsers). To actually prevent scroll, use `useEffect` + `canvas.addEventListener('wheel', handler, { passive: false })` instead of the React `onWheel` prop.

5. **P2 -- `scrollY` is unbounded** (`src/ui/piano-roll/PianoRollEditor.tsx:224`). The plain wheel branch sets `scrollY: prev.scrollY - e.deltaY / prev.noteHeight` with no clamp. The value can drift below 0 or above 127, causing the view to scroll past the valid MIDI note range into empty space with no visual feedback.

6. **P3 -- `CommandRegistry` recreated every render** (`src/ui/piano-roll/PianoRollEditor.tsx:110`). `registry` useMemo depends on `[interactions]`, but `usePianoRollInteractions` returns a new object literal every render, so the dependency always changes. This means the registry (and all its bindings) is rebuilt on every render. Consider memoizing the interactions return value or using a ref for `deleteSelectedNotes`.

7. **P3 -- Module-level `nextNoteId` in midi-recorder leaks across instances** (`src/audio/midi/midi-recorder.ts:35`). The counter persists across `createMidiRecorder()` calls. Not a collision bug (Date.now prefix helps), but surprising if tests or callers expect fresh state per instance.
