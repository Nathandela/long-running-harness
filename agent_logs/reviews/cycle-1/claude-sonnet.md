REVIEW_CHANGES_REQUESTED

---

**1. P2 — `RotaryKnob` visual label ignores `valueText`, displays raw float**

`src/ui/controls/RotaryKnob.tsx:228` renders `{value}` directly. `valueText` is only wired to `aria-valuetext`. For knobs with `step < 1`, `snapToStep` can produce floating-point noise (e.g. `0.10000000000000001`), so the visible label shows garbage. The old `Knob` used `value.toFixed(step < 1 ? 2 : 0)` + `unit`. Fix: render `valueText ?? value` in the visible `<span>`.

---

**2. P2 — `ToggleGroup` radiogroup has no arrow-key navigation**

`src/ui/synth/SynthEditor.tsx:65–104` — The WAI-ARIA radiogroup pattern requires the group to be a single Tab stop and arrow keys to cycle focus+selection between options. The current implementation has no `onKeyDown` on the group; Tab moves through every individual button. This is a keyboard accessibility regression from the native `<select>`.

---

**3. P3 — Buffer fetch errors silently swallowed**

`src/audio/TrackAudioBridgeProvider.tsx` — the new `.catch(() => { /* allow retry */ })` discards all errors with no logging. A bad URL or network error will retry silently on every sync tick with no diagnostic trail. Add at minimum a `console.error` or a dev-mode log.

---

**4. P3 — Weak waveform peaks test assertion**

`src/ui/arrangement/arrangement-renderer.test.ts:385` — `expect(fillCalls.length).toBeGreaterThan(5)` doesn't validate that the correct number of bars (4) were drawn, that they stay within clip bounds, or that the clip path is actually set. A trivially wrong implementation (e.g. drawing 6 filled rects for unrelated reasons) would still pass.
