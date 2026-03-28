You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. P1 — Left-edge resize is broken**
`src/ui/piano-roll/use-piano-roll-interactions.ts:193-206`

Both `note-left-edge` and `note-right-edge` hits set `dragRef` to `kind: "resize-note"` with no field to distinguish which edge was grabbed. The move handler (`line 293`) always adds the pixel delta to `origDuration`, which is correct for the right edge but wrong for the left: a left-edge drag should move `startTime` forward by `delta` and decrease `duration` by the same amount. As implemented, dragging the left edge stretches the note rightward.

Fix: add an `edge: "left" | "right"` field to the `resize-note` drag state; in `onPointerMove` handle the left case with `moveNoteEvent(startTime + delta)` + `resizeNoteEvent(origDuration - delta)`.

---

**2. P2 — `MoveNoteCommand` lazy-capture heuristic corrupts undo for note-at-origin**
`src/state/track/midi-commands.ts:80`

```typescript
if (note && this.oldStartTime === 0 && this.oldPitch === 0) {
```

This guard is used to detect "caller didn't supply old values, capture them now." It fails for any note legitimately at `startTime=0, pitch=0` (MIDI note 0, C-1): `execute()` overwrites `oldStartTime` / `oldPitch` with the pre-move values, but the condition is `true` even after the user supplied `oldStartTime=0, oldPitch=0` explicitly. The check should use a sentinel (`undefined`) or a separate boolean flag instead of `=== 0`.

---

**3. P2 — `registry` useMemo re-creates on every scroll/zoom**
`src/ui/piano-roll/PianoRollEditor.tsx:79`

```typescript
const registry = useMemo(() => { ... }, [interactions]);
```

`interactions` is a new object on every render because `usePianoRollInteractions` returns a plain object (not stabilised). `view` changes on every wheel event, which causes `interactions` to change, which recreates `registry` and re-runs `useKeyboardShortcuts` on every scroll tick. The `deleteSelectedNotes` callback (the only `interactions` dep) should be lifted out so `registry` can depend only on that stable callback.

---

**4. P3 — `pitchToY` accepts two unused parameters**
`src/ui/piano-roll/piano-roll-renderer.ts:63-70`

```typescript
export function pitchToY(
  pitch: number,
  view: PianoRollViewState,
  _height: number,
  _velocityLaneHeight: number,
): number {
```

`_height` and `_velocityLaneHeight` are ignored. All callers pass values to them, making the API misleading. The params should be removed; callers updated.

---

**5. P3 — `velocity-bar` hit result has no handler**
`src/ui/piano-roll/use-piano-roll-interactions.ts:129`

`pianoRollHitTest` can return `{ kind: "velocity-bar" }` but none of the three tool handlers (`pencil`, `select`, `erase`) act on it, so clicking or dragging velocity bars does nothing silently. Either add a handler or remove the `velocity-bar` case from the hit test until it's implemented.
</claude-sonnet-review>

<claude-opus-review>
All 985 tests pass, TypeScript compiles clean. Here's the review:

REVIEW_CHANGES_REQUESTED

1. **P1 -- MoveNoteCommand sentinel value 0 conflates "unset" with valid position** (`src/state/track/midi-commands.ts:80`). The guard `this.oldStartTime === 0 && this.oldPitch === 0` uses 0 as a sentinel for "not yet captured." But pitch 0 (C-1) at startTime 0 is a valid note position. If a note starts at (0, 0), `execute()` re-reads the store on every call instead of using the original values, corrupting undo after any intermediate state change. Fix: use `undefined | number` for `oldStartTime`/`oldPitch` and check `=== undefined`, or a boolean `captured` flag. Same pattern exists in `ResizeNoteCommand:132` (mitigated by min duration 0.01, but still fragile).

2. **P2 -- Left-edge resize drag behaves identically to right-edge** (`src/ui/piano-roll/use-piano-roll-interactions.ts:193-206`). Both `note-left-edge` and `note-right-edge` hit results start the same `resize-note` drag that only changes `duration`. Dragging the left edge should move `startTime` earlier/later and adjust `duration` inversely (keeping the right edge fixed). Currently left-edge drag is indistinguishable from right-edge drag.

3. **P2 -- Pencil draw-note redo restores initial grid-snap size, not final dragged size** (`src/ui/piano-roll/use-piano-roll-interactions.ts:144-157`). On pointerDown, `AddNoteCommand` is pushed with the initial one-grid-step duration. During drag, `resizeNoteEvent` is called directly on the store (no command). On pointerUp, no resize command is pushed. Undo correctly removes the note, but redo re-adds it at the initial small size, discarding the user's drag extension.

4. **P2 -- `handleWheel` `preventDefault()` is a no-op** (`src/ui/piano-roll/PianoRollEditor.tsx:206`). React 17+ attaches wheel listeners as passive by default. `e.preventDefault()` on a passive listener is ignored (and logs a console warning in some browsers). To actually prevent scroll, use `useEffect` + `canvas.addEventListener('wheel', handler, { passive: false })` instead of the React `onWheel` prop.

5. **P2 -- `scrollY` is unbounded** (`src/ui/piano-roll/PianoRollEditor.tsx:224`). The plain wheel branch sets `scrollY: prev.scrollY - e.deltaY / prev.noteHeight` with no clamp. The value can drift below 0 or above 127, causing the view to scroll past the valid MIDI note range into empty space with no visual feedback.

6. **P3 -- `CommandRegistry` recreated every render** (`src/ui/piano-roll/PianoRollEditor.tsx:110`). `registry` useMemo depends on `[interactions]`, but `usePianoRollInteractions` returns a new object literal every render, so the dependency always changes. This means the registry (and all its bindings) is rebuilt on every render. Consider memoizing the interactions return value or using a ref for `deleteSelectedNotes`.

7. **P3 -- Module-level `nextNoteId` in midi-recorder leaks across instances** (`src/audio/midi/midi-recorder.ts:35`). The counter persists across `createMidiRecorder()` calls. Not a collision bug (Date.now prefix helps), but surprising if tests or callers expect fresh state per instance.
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
Error executing tool read_file: Path not in workspace: Attempted path "/tmp/review_diff.patch" resolves outside the allowed workspace directories: /Users/Nathan/Documents/Code/long-running-harness or the project temp directory: /Users/Nathan/.gemini/tmp/long-running-harness
REVIEW_CHANGES_REQUESTED

1. **[P1 - Bug]**: Newly drawn notes lose their dragged duration upon Redo. In `use-piano-roll-interactions.ts`, `AddNoteCommand` is pushed on `pointerDown` with the default duration. Extending the note via drag updates the store but no command captures the final duration on `pointerUp`. Redo restores the original 1-grid-step note, losing the drag change. A `ResizeNoteCommand` should be pushed when finishing a `draw-note` interaction if the duration was extended.
2. **[P2 - Bug]**: `MoveNoteCommand` uses `0` as a sentinel value to detect unset `oldStartTime` and `oldPitch`. If these are explicitly provided as `0` to the constructor, `execute()` falsely treats them as unset and overwrites them with the note's current state. This causes undo history corruption if a note actually starts at time `0` and pitch `0`. It should use `undefined` or a separate boolean flag instead of `0`.
3. **[P2 - Bug]**: The piano roll canvas goes blank when the window is resized while the transport is stopped. In `PianoRollEditor.tsx`, the `ResizeObserver` resizes the canvas buffer (which clears it) but does not call `render()` to redraw the contents. `render` needs to be called after updating canvas dimensions.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
