REVIEW_CHANGES_REQUESTED

**1. P2 — Multi-item delete pushes N separate undo entries**
`use-arrangement-interactions.ts:420-440`: When N clips (or tracks) are selected and deleted, each `RemoveClipCommand`/`RemoveTrackCommand` is pushed individually. Restoring a 3-clip batch delete requires 3 undos. Since multi-select is fully supported (shift-click, rubber-band), this is a real usability regression. Fix: group into a composite/batch undo command, or wrap the loop with a single `BatchCommand`.

**2. P3 — Redundant comment in bounce-engine.ts**
`src/audio/bounce/bounce-engine.ts:387`: The comment `// mapPitchToDrum imported from @audio/drum-machine/drum-types` is noise — the import at the top of the file makes this self-evident. Remove it.

---

Everything else is clean: the `trimClip` MIDI branch is correct (no `sourceOffset`), the VirtualKeyboard noteOff-before-noteOn fix is correct, `DRUM_TO_PITCH`/`mapPitchToDrum` extraction is clean, delete-button hit-test coordinates are consistent with the renderer, and the `onKeyDown` empty `[]` dep array is correct since it reads fresh state via `getState()`.
