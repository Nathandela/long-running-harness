You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
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
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P2 - Drop handler missing undo support** (`ArrangementPanel.tsx:53-97`): `handleDrop` calls `state.addClip(clip)` directly without creating an `UndoCommand` and pushing it to `sharedUndoManager`. The MIDI clip creation on double-click correctly uses undo. Users who drop an audio file onto the arrangement cannot Ctrl+Z to remove it. Wrap in an undo command like the MIDI clip creation does.

2. **P2 - Drop handler has no field validation on parsed JSON** (`ArrangementPanel.tsx:59-64`): The `JSON.parse` result is cast with `as typeof data` but no runtime check verifies the fields exist or have correct types. If the drag data is malformed (e.g. `durationSeconds` is a string or missing), the clip gets created with `NaN` or `undefined` duration. Add a guard like `if (typeof data.sourceId !== 'string' || typeof data.durationSeconds !== 'number') return;`.

3. **P2 - Drop handler allows negative trackIndex** (`ArrangementPanel.tsx:71-74`): When `y - RULER_HEIGHT + view.scrollY` is negative (dragging above the first track), `Math.floor` produces a negative index. `state.tracks[-1]` evaluates to `undefined` in JS (safe, bails out), but the intent would be clearer with an explicit `if (trackIndex < 0) return;` guard, matching defensive patterns elsewhere.

4. **P3 - `editingClipId` can go stale if clip is deleted** (`DawShell.tsx:42`): If a user opens the piano roll for a clip, then undoes the clip creation, `editingClipId` still holds the deleted clip's ID. `PianoRollEditor` handles null clipId but not a stale/nonexistent one -- it would render an empty grid for a clip that no longer exists. Either subscribe to store changes to detect clip deletion, or have `PianoRollEditor` treat a missing clip the same as `null`.

5. **P3 - DawShell piano-roll test doesn't actually test the open-then-close flow** (`DawShell-piano-roll.test.tsx:86-123`): The test named "shows piano roll when MIDI clip is double-clicked and close returns to default" never actually opens the piano roll. The comment says "We can't easily simulate canvas double-click" and only asserts the close button is absent. This test name is misleading -- rename it to match what it actually verifies, or use `act` to call `openPianoRoll` via store state/callback.
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
Error executing tool grep_search: Path does not exist: /Users/Nathan/Documents/Code/long-running-harness/src/state/track/track-store.ts
REVIEW_CHANGES_REQUESTED
1. **P1 (Bug):** Missing undo/redo support for media drag-and-drop. In `src/ui/arrangement/ArrangementPanel.tsx`, the `handleDrop` function directly calls `state.addClip(clip)` to create an audio clip, bypassing the `sharedUndoManager`. This should dispatch an `AddClipCommand` so users can undo dropping a clip.
2. **P3 (Test Quality):** The unit test `"shows piano roll when MIDI clip is double-clicked and close returns to default"` in `src/ui/DawShell-piano-roll.test.tsx` never actually simulates opening the piano roll or clicking the close button. It checks the initial default state and exits without testing the behavior described in its title.
3. **P3 (Code Quality):** In `src/ui/arrangement/use-arrangement-interactions.ts`, an inline `UndoCommand` object is constructed manually when creating a MIDI clip. The codebase already has an `AddClipCommand` class (exported from `track-commands.ts`) which calls `state.addClip` under the hood. Since `state.addClip` handles both audio and MIDI clips identically, reusing `AddClipCommand` is more consistent.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
