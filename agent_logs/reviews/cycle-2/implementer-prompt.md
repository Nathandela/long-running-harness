You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All five findings from the previous review are resolved:

1. **P2 - Pattern lost on track switch**: Module-level `sequencerCache` Map with `getOrCreateSequencer(trackId)` preserves state across unmount/remount. `key={selectedTrack.id}` added to `DrumMachineController`. ✓
2. **P2 - Hardcoded `% 16`**: Changed to `% pattern.steps.length`. ✓
3. **P2 - `aria-expanded` missing**: `aria-expanded={addMenuOpen}` added to the Add Track button. ✓
4. **P3 - No Escape handler**: `keydown` listener for `Escape` added alongside the outside-click handler. ✓
5. **P3 - Missing SynthEditor test**: Test case added for instrument track panel. ✓

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All 5 review findings addressed, all 11 tests pass (including a new test for SynthEditor on instrument tracks).

Checklist against my original findings:

1. **P2 `aria-haspopup`/`aria-expanded`** — Fixed: `aria-haspopup="menu"` and `aria-expanded={addMenuOpen}` added to button.
2. **P2 Escape key** — Fixed: `keydown` listener for `Escape` added in the same `useEffect`.
3. **P3 Sequencer per mount** — Fixed: module-level `sequencerCache` Map keyed by `trackId`, `DrumMachineController` now accepts `trackId` prop with `key={selectedTrack.id}`.
4. **P3 `onParamChange` local-only** — Fixed: `// TODO: propagate param changes to audio engine` comment added.
5. **P3 `onTriggerPad` no-op** — Fixed: `// TODO: wire to audio engine for pad preview` comment added.

Bonus: `handleAddTrack` improved to derive next track number via regex max scan instead of `.length`, preventing duplicate names after deletions. Step modulo now uses `pattern.steps.length` instead of hardcoded 16.

REVIEW_APPROVED
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
REVIEW_APPROVED
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] Drum-machine parameter state still resets when you switch tracks** ([panels.tsx:52](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:52), [panels.tsx:56](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:56), [panels.tsx:67](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:67), [panels.tsx:122](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:122), [panels.tsx:206](/Users/Nathan/Documents/Code/long-running-harness/src/ui/panels.tsx:206))
Detail: The new module-level cache only preserves the `StepSequencer` pattern per `trackId`. The per-instrument drum params are still initialized from `DEFAULT_INSTRUMENT_PARAMS` in local component state and never restored from any per-track cache or store. Because the drum controller is now keyed by `selectedTrack.id`, switching away from a drum track and back remounts the controller and resets all tune/decay/volume values to defaults.
Risk: Users still lose part of the drum-machine state whenever they change selection, so the persistence bug is only partially fixed. Pattern edits survive, but knob settings do not.
Suggestion: Cache drum params per `trackId` alongside the sequencer, or move both pattern and params into a real store. Add a regression test that changes a drum param, switches selection away, then returns to the same drum track and verifies the edited value is preserved.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
