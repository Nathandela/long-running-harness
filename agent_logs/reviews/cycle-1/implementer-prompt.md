You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

**1. P1 — `disconnectFromMixer` severs all output connections** (`drum-kit.ts:134-136`)

`output.disconnect()` disconnects from every destination, not just the target strip. The `_mixer` and `_trackId` parameters are ignored. Should be `output.disconnect(strip.inputGain)` using the specific strip. As-is, calling this in any multi-connection scenario silently breaks all routing. Also identical to `dispose()`.

**2. P1 — `activeOH` not cleared when OH decays naturally** (`drum-kit.ts:78-83`)

The `"ended"` event handler disconnects nodes but never sets `activeOH = null`. After OH finishes its natural decay, `activeOH` holds a stale reference to disconnected nodes. Subsequent CH triggers enter the try/catch, `setValueAtTime` on the dead gain node doesn't throw and silently no-ops, but `activeOH` is only nulled in the CH handler — so repeated CH triggers after natural OH decay each operate on the stale voice until a new OH fires. Fix: set `activeOH = null` inside the "ended" callback when `instrumentId === "oh"`.

**3. P2 — `onSetFlam` prop declared but never used** (`DrumMachinePanel.tsx:23`)

`onSetFlam` is in `DrumMachinePanelProps` and destructured in the component but no UI element calls it. Flam is fully wired in the sequencer but unreachable from the panel. Either add flam UI or remove the dead prop.

**4. P2 — Velocity not clamped at engine boundary** (`drum-kit.ts:65`)

`peakGain = p.volume * velocity` — if a caller passes `velocity > 1`, peak gain exceeds 1. No validation in `trigger()`. Add a `Math.min(1, velocity)` clamp or at minimum document the valid range.

**5. P2 — Knob ranges hardcoded instead of reading from `PARAM_RANGES`** (`DrumMachinePanel.tsx:146-182`)

`min`/`max` values for Tone/Decay/Tune/Vol knobs are hardcoded literals that duplicate `PARAM_RANGES`. Silent divergence risk. Should derive from `PARAM_RANGES[key]`.
</claude-sonnet-review>

<claude-opus-review>
All clean. Here's my review:

REVIEW_CHANGES_REQUESTED

1. **P2 — voice-allocator.ts:229 — `completedSteals.length` mutation defeats pre-allocation in hot path.** The array is pre-allocated to `MAX_VOICES` on line 55 for zero-allocation `processStealFade()`, but `completedSteals.length = completedCount` permanently truncates it every sample. When a steal later occurs, writes past the truncated length cause V8 to re-allocate and transition the array from dense to holey — exactly the allocation the comment on line 54 says to avoid. Fix: return a `{data, count}` pair or a pre-allocated view object instead of mutating `.length`. Update the caller in synth-processor.ts:370 to iterate `ci < completed.count`.

2. **P3 — DrumMachinePanel.tsx:23 — `onSetFlam` prop is accepted but never wired to any UI element.** The prop type declares it, tests don't exercise it, and no JSX renders a flam control. Either add a flam row (like the accent row) or remove the prop to avoid dead API surface.

3. **P3 — drum-kit.ts:134 — `disconnectFromMixer` ignores both arguments.** The method signature takes `mixer` and `trackId` but calls `output.disconnect()` which disconnects from *all* destinations. If the output is ever connected to multiple targets, this will over-disconnect. Minor since there's currently one destination, but the API contract is misleading.
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

1. (P1) **Audio Engine Crash on 0 Volume:** In `drum-kit.ts`, if an instrument's volume is set to exactly `0` (which is allowed by the UI knob's `min={0}`), `peakGain` becomes `0`. Calling `gain.gain.setValueAtTime(0, time)` followed immediately by `gain.gain.exponentialRampToValueAtTime(0.001, ...)` will throw an `InvalidAccessError` `DOMException` because the Web Audio API does not allow exponential ramping from a value of `0` (it must be strictly positive). This will crash the audio thread / sequencer. You should clamp the `peakGain` to a small positive minimum like `Math.max(0.001, p.volume * velocity)`.
2. (P2) **Missing Flam UI Controls:** The `flamMs` feature is fully supported by the audio engine and sequencer types, and `onSetFlam` is defined in `DrumMachinePanelProps`. However, `onSetFlam` is completely omitted from the destructured props in `DrumMachinePanel.tsx` and there is no UI element (e.g., a "Flam row" or modifier) built to actually trigger it.
3. (P3) **Open Hi-Hat Flam Mutual Exclusivity Bug:** In `drum-kit.ts`, when the "oh" (open hi-hat) instrument is triggered, the `activeOH` reference is set to the primary hit's voice. If that step also has a flam hit, the flam creates a second voice which is not tracked by `activeOH`. Consequently, a subsequent "ch" (closed hi-hat) hit will correctly choke the main open hi-hat voice, but the open hi-hat's flam tail will keep ringing.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
