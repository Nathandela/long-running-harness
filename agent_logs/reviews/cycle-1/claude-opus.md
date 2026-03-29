Now I have a complete picture. Here's the review.

REVIEW_CHANGES_REQUESTED

---

**1. P1 -- BounceDialog: cancel does not prevent empty file download**

`BounceDialog.tsx:62-83` -- When the user cancels during a bounce, `handleCancel` sets `cancelFlag` via `engine.cancel()` and closes the dialog. But the async `handleBounce` generator loop continues running. When the engine eventually checks `isCancelled()` it returns `emptyResult` (with `blob: new Blob()`). Since `result.done === true`, the code falls through to lines 75-80 and triggers a browser download of an empty `bounce.wav`. It also calls `onClose()` a second time.

Fix: Check for cancellation (or check blob size > 0) before triggering the download:
```ts
const bounceResult = result.value;
if (bounceResult.blob.size === 0) {
  setBounceState({ status: "idle" });
  return;
}
```

---

**2. P1 -- AutomationLaneEditor: clicking near existing point adds a duplicate AND starts drag**

`AutomationLaneEditor.tsx:61-98` -- Both `onClick` (adds a new point) and `onPointerDown` (starts dragging) fire when the user clicks near an existing automation point. `e.preventDefault()` on `pointerdown` does not prevent the `click` event. This creates a duplicate point at the click position while simultaneously starting a drag on the existing point.

Fix: Track whether a drag was initiated in `onPointerDown` and skip `onClick` when that flag is set, or use a `pointerup` check to decide whether to add a point (e.g., only add on click if no drag occurred).

---

**3. P2 -- arrangement-renderer.test.ts: `ClipModel` used but never imported**

`arrangement-renderer.test.ts:228,253,268,319,369` -- The type `ClipModel` is used in 5 `Record<string, ClipModel>` annotations but only `AudioClipModel` is imported (line 2). This passes vitest (which strips types) but will fail `tsc`/`pnpm check`.

Fix: Add `ClipModel` to the import on line 2:
```ts
import type { TrackModel, AudioClipModel, ClipModel } from "@state/track/types";
```

---

**4. P3 -- AutomationLaneEditor: unused `trackTop` prop**

`AutomationLaneEditor.tsx:9,17` -- `trackTop` is declared in `AutomationLaneEditorProps` but never destructured or used in the component body.

Fix: Remove from the props type, or destructure it if it's needed for layout positioning.

---

**5. P3 -- BounceDialog: `createBounceEngine()` called on every render**

`BounceDialog.tsx:28` -- `useRef(createBounceEngine())` evaluates the factory on every render; only the mount value is kept. The engine is also overwritten on every bounce click (line 47-48), so the initial one is always wasted.

Fix: Use lazy initialization: `useRef<ReturnType<typeof createBounceEngine> | null>(null)` and assign in `handleBounce` only.
