REVIEW_CHANGES_REQUESTED

**1. [P1] Media-pool drop has no undo support**

`ArrangementPanel.tsx` `handleDrop` calls `state.addClip(clip)` directly with no `UndoCommand` pushed to `sharedUndoManager`. The commit description states "All features include undo support" — this is false for the drag feature. Double-click MIDI clip creation does push an undo command; drop does not.

Fix: wrap `addClip` in an `UndoCommand` the same way the MIDI clip creation is handled in `use-arrangement-interactions.ts:394–415`.

---

**2. [P2] `handleDragOver` shows copy cursor over non-audio tracks but `handleDrop` silently discards**

`handleDragOver` (`ArrangementPanel.tsx:50–58`) accepts any drag with the correct MIME type and sets `dropEffect = "copy"`, regardless of which track the cursor is over. `handleDrop` then silently returns when `track.type !== "audio"`. The user sees a valid copy cursor, drops, and nothing happens — no feedback.

Fix: in `handleDragOver`, check the target track type and only call `e.preventDefault()` / set `dropEffect` when the resolved track is an audio track. Alternatively show an error toast on rejected drops.

---

**3. [P2] Misleading test — name claims piano roll opens but body tests nothing of the sort**

`DawShell-piano-roll.test.tsx:71`: test named `"shows piano roll when MIDI clip is double-clicked and close returns to default"` sets up a MIDI clip, renders `DawShell`, then only asserts the *initial* state (no piano roll visible, no close button). The comment inside acknowledges `"we test the close button works by checking that the close button only appears when piano roll is open"` — but the close button is never clicked because the piano roll is never opened. The test name is false advertising; CI will pass regardless of whether the feature works.

Fix: either remove the test or replace it with an integration test that uses `useDawStore.setState` to set `bottomPanel = "piano-roll"` / `editingClipId` or expose state-setting via props/context.

---

**4. [P3] `addMidiClip`/`removeMidiClip` are functionally identical to `addClip`/`removeClip`**

`store.ts:368–391` duplicates the exact logic of `addClip`/`removeClip`. The drop handler uses `addClip`; the inline undo command uses `addMidiClip`. Two code paths do the same thing via different methods, creating future confusion. No bug today, but one of the two should be removed (the generic `addClip` already accepts `MidiClipModel` through the `ClipModel` union).
