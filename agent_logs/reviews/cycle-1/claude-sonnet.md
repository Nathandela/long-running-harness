REVIEW_CHANGES_REQUESTED

---

**1. [P1] `useKeyboardShortcuts`: `contenteditable="false"` incorrectly blocks shortcuts**
`src/ui/keyboard/useKeyboardShortcuts.ts:18`

`getAttribute("contenteditable") !== null` returns `true` for `contenteditable="false"` — explicitly non-editable elements will silently swallow shortcuts. Fix:
```ts
if (target.isContentEditable) {
```

---

**2. [P2] `Button`: native `disabled` attribute never set on underlying `<button>`**
`src/ui/primitives/Button.tsx:39`

`disabled` is destructured and excluded from `...rest`. The `<button>` only gets `aria-disabled`. This means:
- `type="submit"` buttons bypass disability on form Enter-key submission
- Other event handlers from `...rest` (e.g. `onKeyDown`) still fire when disabled

Either pass `disabled={disabled}` explicitly to the `<button>`, or document clearly that this is an intentional visually-only pattern.

---

**3. [P2] `Modal`: `showModal()` throws `InvalidStateError` if called when already open**
`src/ui/primitives/Modal.tsx:24`

If the parent re-renders with `open=true` twice (or the dialog is opened externally), `showModal()` on an already-open `<dialog>` throws. Add a guard:
```ts
if (open && !dialog.open) {
  dialog.showModal();
}
```
Similarly, `dialog.close()` on a never-opened dialog is a no-op in modern browsers but the `dialog.open` check would be cleaner defensive code.

---

**4. [P2] `ContextMenu`: no viewport overflow protection**
`src/ui/primitives/ContextMenu.tsx:114`

Menu position is raw `clientX/clientY` with no bounds check. Near screen edges the menu clips off-screen. Need to clamp against `window.innerWidth` / `window.innerHeight` after measuring `menuRef`.

---

**5. [P2] `RotaryKnob`: mouse drag doesn't snap to `step`**
`src/ui/controls/RotaryKnob.tsx:132`

```ts
commit(startValue + delta * step);
```

This produces continuous float values regardless of `step`. `Fader.valueFromY` correctly does `Math.round(raw / step) * step`. Apply the same rounding here.

---

**6. [P3] `VuMeter`: `level` prop unclamped — out-of-range values corrupt rendering**
`src/ui/controls/VuMeter.tsx:51`

`level > 1` makes `barTop` negative (bar exceeds canvas height). `level < 0` draws nothing but `buildAriaLabel` shows a negative percentage. Clamp at the top of the component:
```ts
const clampedLevel = Math.min(1, Math.max(0, level));
```

---

**7. [P3] `ContextMenu`: duplicate item labels produce duplicate React keys**
`src/ui/primitives/ContextMenu.tsx:118`

`key={item.label}` — use array index or a unique `id` field on `MenuItem`.
