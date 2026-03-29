You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
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
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P2 — RotaryKnob visual display regression: units and formatting lost.** The old `Knob` component displayed `{value.toFixed(step < 1 ? 2 : 0)}{unit ?? ""}` (e.g. `0.05s`, `20000Hz`, `50c`). The new `RotaryKnob` displays raw `{value}` at `src/ui/controls/RotaryKnob.tsx:228`. The `valueText` prop is only wired to `aria-valuetext` (line 188), not the visual span. All unit suffixes (Hz, s, c, st) are invisible to sighted users. Fix: display `valueText ?? String(value)` in the span, or add a `formatValue` prop.

2. **P3 — ToggleGroup buttons missing `type="button"`.** In `src/ui/synth/SynthEditor.tsx:81`, the `<button>` elements default to `type="submit"`. If ever placed inside a `<form>`, they would trigger form submission. Add `type="button"` to the `<button>` element.

3. **P3 — Silent error swallowing in buffer prefetch.** `src/audio/TrackAudioBridgeProvider.tsx:64` catches fetch errors with an empty body. If `getAudioBuffer` fails persistently (e.g. CORS, network), there's no feedback. Add at minimum `console.warn("Failed to prefetch buffer:", clip.sourceId)` to aid debugging.
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
    at Socket.<anonymous> (node:internal/child_process:456:11)
    at Socket.emit (node:events:518:28)
    at Pipe.<anonymous> (node:net:351:12) {
  code: -32000,
  data: undefined
}
MCP issues detected. Run /mcp list for status.Scheduling MCP context refresh...
Executing MCP context refresh...
MCP context refresh complete.
REVIEW_CHANGES_REQUESTED

1. **[P1] Missing waveform wiring**: `ArrangementPanel.tsx` does not pass `clipPeaks` when calling `renderArrangement()`. The waveform rendering logic in the renderer is therefore dead code and will not appear in the application.
2. **[P1] Incorrect waveform slicing logic**: In `arrangement-renderer.ts`, the waveform rendering loop iterates over all `peakData.length` and maps it across the entire clip width `w`. Because `peakData` represents the entire source file, this incorrectly stretches the full source audio into the clip bounds, entirely ignoring `clip.sourceOffset` and `clip.duration`. `RenderContext` also lacks `samplesPerPeak` and `sampleRate`, making it mathematically impossible to calculate the correct peak slice.
3. **[P2] Visual regression in SynthEditor**: The migration to `RotaryKnob` in `SynthEditor.tsx` passes `valueText` for formatting, but the underlying `RotaryKnob` component only uses this for `aria-valuetext` and strictly renders the raw `value` number visually. This removes all visual units (e.g., `Hz`, `s`, `st`, `c`) from the UI that were present in the old `Knob` component and can display unformatted floating point precision artifacts due to the removal of the previous `.toFixed()` rendering logic.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
