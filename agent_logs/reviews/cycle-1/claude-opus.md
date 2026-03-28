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
