REVIEW_CHANGES_REQUESTED

---

**1. P1 — Drag interactions bypass undo system**

`use-arrangement-interactions.ts` calls store actions directly (`state.moveClip`, `state.trimClip`, `state.splitClip`) instead of dispatching `MoveClipCommand`, `TrimClipCommand`, `SplitClipCommand`. Mouse-driven moves, trims, and double-click splits are completely non-undoable despite the command infrastructure existing. `onMouseUp` just resets drag state — no final undo entry is committed.

**2. P1 — HiDPI rendering broken (`ArrangementPanel.tsx:44-46`)**

`renderArrangement` receives `width: canvas.width` and `height: canvas.height` (physical pixels = `rect.width * dpr`) while a `ctx.scale(dpr, dpr)` transform is active. The renderer treats physical-pixel dimensions as logical coordinates: `fillRect(0, 0, width, height)` draws at 2× the canvas size on retina (cropped), and all visibility culling (`x > rc.width`) compares logical x against physical width — clips off-screen by logical measure still render, and clips within logical bounds get skipped at the wrong threshold. On dpr=2 displays the arrangement will appear zoomed in and clipped. Fix: pass `rect.width` / `rect.height` (logical pixels) to the renderer.

**3. P2 — `hexToRgba` doesn't guard against invalid/short hex colors (`arrangement-renderer.ts:59-64`)**

`parseInt(hex.slice(1,3), 16)` on a 4-char `#rgb` string or any non-hex color (CSS named color, `hsl(...)`) returns `NaN`, producing `rgba(NaN,NaN,NaN,...)`. Canvas silently ignores invalid `fillStyle`, leaving clips invisible. No validation or fallback is present.

**4. P2 — Module-level `clipIdCounter` breaks test isolation (`store.ts:63-66`)**

`let clipIdCounter = 0` is never reset. Tests that call `splitClip` or `duplicateClip` accumulate the counter across test files, making generated IDs non-deterministic relative to test order. Any test that asserts on a generated clip ID will be fragile.

**5. P2 — Every `mousemove` commits a store mutation during drag (`use-arrangement-interactions.ts:198, 212, 223`)**

`state.moveClip` / `state.trimClip` are called on raw `mousemove` with no throttle or ghost-preview strategy. Each call triggers a Zustand set → React re-render → RAF re-schedule cycle. At 60fps mouse input this is dozens of full state mutations per second for the duration of a drag. Should use local preview state during drag and commit once on `mouseUp`.

**6. P3 — Double spread in `duplicateClip` (`store.ts:296`)**

```ts
const nextClips = { ...s.clips, [newId]: duplicate };   // already includes s.clips
return { clips: { ...s.clips, ...nextClips }, tracks };  // spreads s.clips twice
```

`nextClips` already contains all of `s.clips`, so the outer spread is redundant. Should be `{ clips: nextClips, tracks }`.

**7. P3 — Floating-point `isBar` check unreliable at large offsets (`arrangement-renderer.ts:127`)**

`Math.abs(t % secPerBar) < 0.001` with `t` accumulated via repeated `+= step` will drift. At 120 BPM (step = 0.5s) at bar 1000, accumulated error can exceed the 0.001 threshold, causing bar lines to render as beat lines. Use integer bar arithmetic: `Math.round(t / secPerBar) * secPerBar` to test if `t` is on a bar.
