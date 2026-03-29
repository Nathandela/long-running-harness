REVIEW_CHANGES_REQUESTED

1. **P2 — RotaryKnob visual display regression: units and formatting lost.** The old `Knob` component displayed `{value.toFixed(step < 1 ? 2 : 0)}{unit ?? ""}` (e.g. `0.05s`, `20000Hz`, `50c`). The new `RotaryKnob` displays raw `{value}` at `src/ui/controls/RotaryKnob.tsx:228`. The `valueText` prop is only wired to `aria-valuetext` (line 188), not the visual span. All unit suffixes (Hz, s, c, st) are invisible to sighted users. Fix: display `valueText ?? String(value)` in the span, or add a `formatValue` prop.

2. **P3 — ToggleGroup buttons missing `type="button"`.** In `src/ui/synth/SynthEditor.tsx:81`, the `<button>` elements default to `type="submit"`. If ever placed inside a `<form>`, they would trigger form submission. Add `type="button"` to the `<button>` element.

3. **P3 — Silent error swallowing in buffer prefetch.** `src/audio/TrackAudioBridgeProvider.tsx:64` catches fetch errors with an empty body. If `getAudioBuffer` fails persistently (e.g. CORS, network), there's no feedback. Add at minimum `console.warn("Failed to prefetch buffer:", clip.sourceId)` to aid debugging.
