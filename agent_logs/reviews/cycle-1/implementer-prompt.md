You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
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
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P2 — Missing `aria-haspopup` / `aria-expanded` on the Add Track button** (`src/ui/transport/TransportBar.tsx:110-118`). The button toggles a `role="menu"` dropdown but lacks `aria-haspopup="menu"` and `aria-expanded={addMenuOpen}`. Screen readers won't announce the menu relationship. Add both attributes to the trigger button.

2. **P2 — Dropdown not closable via Escape key** (`src/ui/transport/TransportBar.tsx:84-99`). The outside-click handler closes the menu on `mousedown`, but there is no keyboard handler for `Escape`. Users navigating via keyboard have no way to dismiss the menu without clicking away. Add a `keydown` listener for `Escape` in the same `useEffect`.

3. **P3 — `useDrumMachineState` creates a new `stepSequencer` per mount, not per track** (`src/ui/panels.tsx:35-39`). When the user switches between drum tracks, `DrumMachineController` remounts and creates a fresh sequencer — losing the pattern of the previous drum track. If the app ever supports multiple drum tracks, each one shares the same ephemeral state. Fine for now, but worth a TODO comment noting this is single-track-only.

4. **P3 — `onParamChange` updates local state only** (`src/ui/panels.tsx:104-116`). Drum instrument param changes (decay, tone, etc.) are stored in component state but never propagated to the audio engine or persisted in the store. The params drift silently — the UI shows values that have no audio effect. Either connect to the audio layer or add a comment noting this is intentionally visual-only for now.

5. **P3 — `onTriggerPad` is a no-op** (`src/ui/panels.tsx:100-102`). The callback does nothing — pad taps are silently swallowed. If this is intentional (audio wiring deferred), note it explicitly, e.g. `// TODO: wire to audio engine for pad preview`.
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

1. **P2** - Localized `DrumMachineController` state causing data loss: The drum pattern state (`useState(() => createStepSequencer(...))`) is completely localized to the `DrumMachineController` component. If the user selects a non-drum track, the controller unmounts, and the entire drum pattern is permanently lost. State should be hoisted to the global store or cached by `trackId`.
2. **P2** - Missing `key` prop on `DrumMachineController`: In `InstrumentPanel`, `DrumMachineController` is rendered without a `key={selectedTrack.id}` prop. When switching between multiple drum tracks, React reuses the exact same component instance, meaning the step sequencer UI and its local pattern state will incorrectly bleed across all drum tracks.
3. **P3** - Naive track naming logic: In `TransportBar.tsx`, track naming uses `.length` of existing tracks (e.g., `trackCount + 1`). If a track is deleted (e.g., "Audio 1"), creating a new one will duplicate names (e.g., resulting in two tracks named "Audio 2").
4. **P3** - Missing accessibility attributes on Add Track menu: The `+` button in `TransportBar` lacks `aria-haspopup="menu"` and `aria-expanded={addMenuOpen}` attributes, reducing accessibility for screen readers navigating the track creation dropdown.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
