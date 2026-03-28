You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
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
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P1 - VuMeter: Runaway rAF loop when `peak` is undefined and level > 0.** In `VuMeter.tsx:63-75`, the `draw` callback is in the `useEffect` dependency array. Each `draw` call triggers `requestAnimationFrame(animate)`, but `draw` is recreated every render (it depends on `level`). When the peak decays to 0 the loop stops, but if a parent re-renders frequently (e.g., real-time audio metering), each render creates a new effect that starts a new rAF chain before the previous one's cleanup fires, potentially stacking animation frames. Fix: gate the rAF start more carefully, or track whether an animation is already running via a `boolean` ref.

2. **P1 - Fader: Mouse drag leaks event listeners on unmount.** `Fader.tsx:60-75` registers `mousemove`/`mouseup` on `document` inside `handleMouseDown`, but if the component unmounts mid-drag, the effect cleanup won't remove these listeners (they're not tracked by any `useEffect`). Fix: store the listeners in a ref and clean them up in a `useEffect` return, or use `AbortController`.

3. **P1 - RotaryKnob: Same mouse drag listener leak on unmount.** `RotaryKnob.tsx:99-118` has the identical pattern — `mousemove`/`mouseup` listeners on `document` with no cleanup on unmount.

4. **P2 - Modal: `showModal()` called on already-open dialog throws.** `Modal.tsx:23-29` calls `dialog.showModal()` every time `open` changes to `true`, but if the dialog is already open (e.g. parent re-renders with `open=true`), the browser throws `InvalidStateError`. Fix: guard with `if (!dialog.open) dialog.showModal()`.

5. **P2 - ContextMenu: Menu can render off-screen.** `ContextMenu.tsx:85` positions the menu at raw `clientX`/`clientY` without clamping to viewport bounds. Right-clicking near the bottom-right corner will clip the menu.

6. **P2 - ContextMenu: Arrow key navigation doesn't skip disabled items.** `ContextMenu.tsx:72-81` cycles `focusIndex` over all items including disabled ones. Users can focus and Enter on non-disabled items, but keyboard navigation lands on disabled items with no visual distinction beyond opacity.

7. **P2 - Token duplication between `tokens.ts` and `tokens.css`.** The same values exist in two places with no generation step. These will inevitably drift. Consider generating one from the other or at minimum adding a test that asserts parity.

8. **P2 - `useReducedMotion` SSR incompatibility.** `useReducedMotion.ts:5` calls `window.matchMedia` in the `useState` initializer. This will throw in SSR or any environment without `window`. May not matter for this DAW app, but worth noting.

9. **P3 - Button: `disabled` prop uses `aria-disabled` + strips `onClick`, but does not set native `disabled`.** `Button.tsx:36-38` relies on `pointer-events: none` CSS and `aria-disabled` instead of the native `disabled` attribute. This means the button remains in tab order and screen readers may not announce it as properly disabled in all contexts.

10. **P3 - Tooltip: `cloneElement` usage.** `Tooltip.tsx:27` uses the deprecated `cloneElement` API. React docs recommend render props or composition instead. Not urgent but will trigger warnings in future React versions.
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
REVIEW_CHANGES_REQUESTED

1. **[P0] Type Error / Build Failure:** `src/ui/primitives/Tooltip.tsx` fails to compile with `TS2769` on `cloneElement` because `aria-describedby` is not a statically known prop on the generic `React.ReactElement` `children` type in React 19 typings.
2. **[P1] Accessibility / Focusability:** `src/ui/primitives/Button.tsx` accepts a custom `disabled` prop but omits passing the native `disabled={disabled}` attribute down to the underlying `<button>`. This leaves the button fully focusable and activatable via keyboard events (e.g. Enter).
3. **[P1] Audio Trigger Latency:** `src/ui/controls/DrumPad.tsx` binds the trigger event to `onClick`. For a DAW drum pad, `onClick` introduces significant perceptible latency as it fires on pointer *up*. It must bind to `onPointerDown` or `onMouseDown` for immediate audio playback.
4. **[P1] Memory Leak / Stale Closures:** `src/ui/controls/Fader.tsx` and `src/ui/controls/RotaryKnob.tsx` attach global `mousemove` and `mouseup` listeners to the `document` during dragging, but lack `useEffect` cleanup. If either component unmounts while the user is actively dragging, the event listeners are leaked and will throw errors when invoked.
5. **[P2] Drag UX / Sensitivity:** `src/ui/controls/RotaryKnob.tsx` calculates its drag entirely via `delta * step` instead of mapping the pixel drag distance against a logical fraction of the `max - min` range. This UX flaw makes the control unusable for large ranges (e.g., requires moving the mouse 2000+ pixels to span a frequency range if `step` is small relative to the range).
6. **[P2] Floating State Issue:** `src/ui/primitives/ContextMenu.tsx` uses a global `click` listener to close when clicking outside, but it misses the global `contextmenu` event. Right-clicking elsewhere on the page opens the native context menu while leaving the custom context menu visibly stuck open.
7. **[P3] Incorrect Editable Check:** `src/ui/keyboard/useKeyboardShortcuts.ts` checks for editable elements by checking `target.getAttribute("contenteditable") !== null`. This erroneously excludes elements with `contenteditable="false"`. It should use the native `target.isContentEditable` boolean.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
