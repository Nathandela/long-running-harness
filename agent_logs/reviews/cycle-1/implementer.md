Commit passed all hooks (lint, tsc, prettier). Here's a summary of all fixes applied:

**P0 (1 fix):**
- **Tooltip** - Typed `children` as `ReactElement<HTMLAttributes<HTMLElement>>` to fix TS2769 with `cloneElement`

**P1 (7 fixes):**
- **useKeyboardShortcuts** - `target.isContentEditable` instead of `getAttribute("contenteditable") !== null`
- **Button** - Native `disabled` attribute instead of `aria-disabled` only
- **Modal** - Guard `showModal()`/`close()` with `dialog.open` check to prevent `InvalidStateError`
- **VuMeter** - Clamp level to [0,1], prevent rAF stacking via `animatingRef`
- **Fader** - `AbortController` for drag listeners, cleanup on unmount
- **RotaryKnob** - Same `AbortController` pattern, plus snap-to-step and range-mapped drag sensitivity
- **DrumPad** - `onPointerDown` instead of `onClick` for low-latency audio triggering

**P2 (4 fixes):**
- **ContextMenu** - Viewport overflow clamping after render
- **ContextMenu** - Arrow keys skip disabled items via `findNextEnabledIndex`
- **ContextMenu** - Close on outside `contextmenu` event
- **ContextMenu** - Index-based keys to avoid duplicate label collisions

All 177 tests pass, TypeScript compiles clean, ESLint + Prettier pass.

FIXES_APPLIED
