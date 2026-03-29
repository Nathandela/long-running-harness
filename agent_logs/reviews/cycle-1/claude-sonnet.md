REVIEW_CHANGES_REQUESTED

---

**1. P2 — Drum machine pattern lost on track switch** (`src/ui/panels.tsx:35-39`)

`useDrumMachineState` initializes the step sequencer in `useState`. Every time a drum track is selected (after switching away), `DrumMachineController` mounts fresh and the pattern resets to empty. User's programmed steps are silently discarded. The pattern needs to live outside the component — in the Zustand store, a ref keyed by `trackId`, or a module-level map.

---

**2. P2 — `aria-expanded` missing on Add Track button** (`src/ui/transport/TransportBar.tsx:115`)

The toggle button opens a `role="menu"` but never exposes `aria-expanded={addMenuOpen}`. Screen readers have no signal that the popup opened or closed. WCAG 4.1.2 / Button pattern requirement.

---

**3. P3 — Hardcoded `% 16` step wrap** (`src/ui/panels.tsx:67`)

```ts
const step = Math.floor(cursor / stepDuration) % 16;
```

`pattern` is in scope here. The constant should be `% pattern.steps.length`. Currently harmless since all patterns are 16 steps, but will silently drift if pattern length ever varies.

---

**4. P3 — No Escape / arrow-key handling for dropdown** (`src/ui/transport/TransportBar.tsx`)

The element has `role="menu"` with `role="menuitem"` children, which per WAI-ARIA requires keyboard navigation: `Escape` to close, `ArrowDown`/`ArrowUp` to move focus between items. Currently only outside-click closes it. Focus doesn't move into the menu on open either.

---

**5. P3 — Missing test: InstrumentPanel with instrument track** (`src/ui/track-creation.test.tsx`)

All three InstrumentPanel branches are described in the test file header, but there is no test case asserting `SynthEditor` renders for `type: "instrument"`. The drum and audio cases are covered but this one is absent.
