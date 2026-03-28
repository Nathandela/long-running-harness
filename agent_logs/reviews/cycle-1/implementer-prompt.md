You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. [P1] `enabled` flag not enforced in `scheduleStep`**

`arpeggiator.ts:168` — `scheduleStep` never checks `params.enabled`. If a caller drives the arpeggiator while it's disabled, note events will still fire. The `enabled` field is dead state inside the engine. Either guard at the top of `scheduleStep`:
```ts
if (!params.enabled) return;
```
or document clearly that callers are solely responsible for gating — but then remove `enabled` from `ArpParams` since it belongs in caller logic.

---

**2. [P2] Compile-time sync check is a no-op**

`arpeggiator-schema.ts:38-41`:
```ts
const _syncCheck: _SchemaType = {} as ArpParams;
const _reverseCheck: ArpParams = {} as _SchemaType;
```
`as` casts bypass structural checks. If a field is added to `ArpParams` but omitted from the schema, this will still compile. The check provides false confidence. Use direct assignment without cast:
```ts
const _syncCheck: _SchemaType = null as unknown as ArpParams;
const _reverseCheck: ArpParams = null as unknown as _SchemaType;
```
These fail at compile time when types diverge.

---

**3. [P2] `latchSnapshot` not updated on `noteOff` — stale notes enter latch pool**

`arpeggiator.ts:147-158` — The snapshot is only taken on `noteOn`. Scenario: press 60, 64, 72 (snapshot = [60,64,72]), release 72 (no snapshot update), release 64 (no snapshot update), release 60 → `latchedNotes = [60,64,72]` but 72 and 64 were released before the latch triggered. A note that was explicitly released still ends up latched. Update the snapshot on `noteOff` as well:
```ts
heldNotes.splice(idx, 1);
if (params.latch) latchSnapshot = heldNotes.map((h) => ({ ...h }));
```

---

**4. [P3] `stepIndex` (swing) and `stepCounter` (pattern) can drift out of sync**

`arpeggiator.ts:168-179` — Swing uses the external `stepIndex` for even/odd detection, while pattern position uses the internal `stepCounter`. If the external scheduler resets its counter (e.g., transport restart) without calling `arp.reset()`, swing phase and pattern position become desynchronized. Consider using `stepCounter` for swing parity instead of `stepIndex`, or drop the `stepIndex` parameter entirely.

---

**5. [P3] `noteOn` accepts out-of-range MIDI values silently**

`arpeggiator.ts:139` — No validation on `note` (0–127) or `velocity` (0–127). Out-of-range notes propagate to the output `ArpNoteEvent` where downstream audio code may fail silently or clip. The octave-expansion code already filters notes `> 127` (correctly), but values like `note = -1` from root held notes still emit negative MIDI numbers from `scheduleStep` if octave direction is `"down"`.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_APPROVED

Findings (all low-severity, none blocking):

1. **P3 - `insertionCounter` grows unboundedly** (`arpeggiator.ts:45,139`): The counter increments on every `noteOn` but never resets (not even in `reset()` or `allNotesOff()`). For "as-played" pattern this is fine since only relative ordering matters, and in practice it would take billions of noteOn calls to cause issues. Not actionable now, but worth noting.

2. **P3 - `rateDivisionToBeats` allocates a new map on every call** (`arpeggiator-types.ts:41-51`): The `Record` is rebuilt each invocation. Functionally correct; if called in a hot scheduling loop it could be lifted to a module-level constant, but this is a micro-optimization unlikely to matter.

3. **P3 - `buildSequence()` rebuilds on every `scheduleStep`** (`arpeggiator.ts:57,169`): The sorted/expanded sequence is recomputed each step even when the note pool hasn't changed. No correctness issue; just a potential optimization point if scheduling becomes a bottleneck.

4. **P3 - Schema enum literals duplicated** (`arpeggiator-schema.ts:10,21`): Pattern/direction/rate-division string literals are repeated in the Zod schema rather than derived from the `as const` arrays. The compile-time sync check at lines 38-42 catches drift, so this is safe — just slightly fragile.

All findings are P3 (informational). Code is clean, well-tested (54 tests), correctly typed, and properly integrated into session persistence. Engine logic for patterns, octave expansion, latch, gate, and swing is sound.
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

1. **[P0] Missing Session Persistence Integration:** The commit claims to add "session persistence" and includes the `arpeggiator` field in `sessionSchema`, but the actual integration is completely missing. `useArpeggiatorStore` is not used in `src/state/session/use-session-persistence.ts`: the arpeggiator state is not serialized in `storeToSession()`, it is not restored in `hydrateStore()`, and the `autoSave` effect does not subscribe to `useArpeggiatorStore` changes.
2. **[P1] Missing Track Lifecycle Integration:** The methods `useArpeggiatorStore.initArp` and `removeArp` are never called outside of tests. These must be wired into track creation (`addTrack`) and deletion (`removeTrack`) within `useDawStore` or the relevant track commands. Without this, newly created tracks will have an uninitialized arpeggiator state, and deleted tracks will cause memory/state leaks.
3. **[P2] Latch Snapshot Bug on Dynamic Toggle:** In `src/audio/arpeggiator/arpeggiator.ts`, `latchSnapshot` is only updated inside `noteOn()` when `params.latch` is true. If a user holds a chord and *then* turns on Latch dynamically via `setParams`, the `latchSnapshot` remains empty. When those keys are subsequently released, the arpeggiator latches an empty pool and stops playing instead of latching the held notes. `setParams()` should update `latchSnapshot` with the current `heldNotes` if `latch` transitions from false to true.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
