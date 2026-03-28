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
