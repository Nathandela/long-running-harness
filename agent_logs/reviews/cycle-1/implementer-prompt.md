You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
Now I have enough context. Let me compile findings.

REVIEW_CHANGES_REQUESTED

---

**1. [P0] Double `useTransport()` instantiation — keyboard shortcuts and UI operate on separate clocks**

`DawShell` calls `useTransportShortcuts(registry, shortcuts)` (line 13 in `DawShell.tsx`), which internally calls `useTransport()`. It also renders `<Toolbar />` → `<TransportBar />` which calls `useTransport()` independently. Each `useTransport()` call creates its own `TransportClock`, `LookAheadScheduler`, `Metronome`, and `SharedArrayBuffer` via the `useEffect` on mount. The spacebar shortcut operates on clock A; the UI play/stop buttons operate on clock B. They're completely independent — two metronomes will fire, two schedulers will run. `useTransport()` must be lifted to context or the shortcut hook must accept the transport as a prop.

---

**2. [P1] Cursor display stuck at 0 during playback**

`useTransportCursor` (`src/ui/hooks/useTransportCursor.ts:24`) reads `CURSOR_SECONDS` from the SAB in an RAF loop. But `writeSABCursor` is only called inside `getCursorSeconds()`, `pause()`, `stop()`, and `seek()`. Nothing calls `getCursorSeconds()` periodically during playback — the `use-transport.ts` play callback calls `clock.play()` and `storePlay()` but no RAF or interval that drives the SAB write. The cursor display reads a stale SAB value (0 or the last pause position) for the entire play duration.

Fix: drive the SAB cursor write from the same RAF loop that reads it, or add an RAF in `use-transport.ts` while playing that calls `getCursorSeconds()` (which already writes the SAB as a side-effect).

---

**3. [P2] `useTransportShortcuts` re-registers and rebinds on every state transition**

`transportState` is in the `useEffect` dependency array (`useTransportShortcuts.ts:37`). Every play/pause/stop triggers an unregister + re-register + rebind cycle. The command's `execute` closure already captures the current state correctly; `transportState` only needs to be in the closure, not the deps. Use a ref for `transportState` or restructure the command to delegate to transport functions that check state internally.

---

**4. [P2] `getCursorSeconds()` mutates SAB and re-anchors playback state as a side-effect**

`transport-clock.ts:143-145` re-anchors `playStartContextTime` and `playStartCursorSeconds` on loop wrap inside a read-only accessor. Side-effecting getters are a correctness hazard: calling the function for display purposes alters the reference frame for all subsequent timing calculations. If two callers invoke `getCursorSeconds()` at different `ctx.currentTime` values within the same frame (once from the future RAF, once from scheduler), the second call computes position relative to the re-anchor made by the first. Separate the display-read path from the loop-wrap state mutation.

---

**5. [P3] `TempoMap.secondsToSamples()` returns a float**

`tempo-map.ts:53`: `return seconds * sampleRate` — returns a non-integer for most inputs. Any consumer expecting an integer sample offset will silently get a float. Should return `Math.round(seconds * sampleRate)` or callers must document the truncation responsibility. Currently unused, but will bite when wired to the scheduler.
</claude-sonnet-review>

<claude-opus-review>
I have all the information I need. Here's my consolidated review:

REVIEW_CHANGES_REQUESTED

1. **P1 — `secondsToBBT` tick overflow to 480** (`src/audio/tempo-map.ts:68`). `Math.round(fractionalBeat * 480)` produces 480 when `fractionalBeat` is close to 1.0 (e.g., 0.999). Tick must be 0–479. Fix: use `Math.floor()`, or handle the 480 case by incrementing beat/bar.

2. **P1 — `useTransportShortcuts` re-registers command on every state change** (`src/ui/transport/useTransportShortcuts.ts:37`). `transportState` is in the dependency array, so every play/stop unregisters+re-registers the shortcut binding. During the brief gap, a keypress could be dropped. Fix: store `transportState` in a ref, read from ref inside `execute`, remove from deps.

3. **P2 — `seek()` accepts negative seconds** (`src/audio/transport-clock.ts:110`). No clamp to `>= 0`. Negative cursor produces garbage BBT (negative bars). Add `Math.max(0, seconds)`.

4. **P2 — `beatsPerBar` captured once at init** (`src/audio/use-transport.ts:68`). `const beatsPerBar = clock.getTempoMap().timeSignature.numerator` is closed over in the scheduler callback. If time signature or BPM changes, `beatsPerBar` stays stale — downbeat detection breaks after a `setBpm` call since `setBpm` creates a new `TempoMap` but the callback still reads the old numerator.

5. **P2 — Metronome oscillators never disconnected** (`src/audio/metronome.ts:39-43`). Stopped oscillators remain connected to the gain node. The Web Audio spec will eventually GC them, but explicit cleanup via `osc.onended = () => osc.disconnect()` reduces GC pressure in long sessions with hundreds of ticks/minute.

6. **P2 — `getCursorSeconds()` mutates anchor state as a side effect** (`src/audio/transport-clock.ts:142-144`). A "get" method silently re-anchors `playStartContextTime` and `playStartCursorSeconds` during loop wrap. If called multiple times in the same frame (e.g., by both the scheduler and cursor display), the second call computes from a re-anchored baseline — the position will be subtly different. Either document explicitly or split into `getCursorSeconds()` (pure read) and `advanceCursor()` (mutating).

7. **P3 — SAB Float64 cursor writes are non-atomic** (`src/audio/transport-clock.ts:73-74`, documented at `shared-buffer-layout.ts:29-31`). Currently safe because reads happen on the same thread. When an AudioWorklet reads the SAB in the future, torn reads on Float64 are possible. Tracking issue recommended.

8. **P3 — No test for tick=480 edge case** (`src/audio/tempo-map.test.ts`). The round-trip test at line 106 uses clean values (0.25, 0.5, etc.) that never trigger the rounding boundary. Add a test with a value like `0.4999s` at 120 BPM to catch the overflow.
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

1. **[P0] Transport cursor freezes during playback**  
   The `SharedArrayBuffer` for the UI cursor is only updated inside `TransportClock.getCursorSeconds()`. However, `getCursorSeconds()` is never called continuously (e.g., inside the scheduler loop or a RAF). As a result, `useTransportCursor` reads a static value and the UI playhead never advances.  
   *Action:* Call `clock.getCursorSeconds()` periodically (e.g., inside `LookAheadScheduler.advance()`) to ensure the `SharedArrayBuffer` receives continuous updates.

2. **[P0] `LookAheadScheduler` loses metronome phase on resume/seek**  
   `scheduler.start()` unconditionally sets `nextBeatTime = ctx.currentTime` and `currentBeat = 0`. If playback is paused at beat 3.5 and resumed (or if a user seeks), the metronome instantly plays a downbeat at the current context time, losing complete synchronization with the project's actual phase and BBT tempo map.  
   *Action:* Modify `start()` to calculate the initial `nextBeatTime` and `currentBeat` based on the transport clock's actual playhead position.

3. **[P0] `LookAheadScheduler` ignores the loop region**  
   The loop wrapping logic is encapsulated inside `TransportClock.getCursorSeconds()`. Since the scheduler independently loops via `nextBeatTime += spb` and ignores the clock's boundaries, scheduled audio events continue linearly to infinity and fail to wrap when the end of the loop is reached.  
   *Action:* Ensure the scheduler checks the active loop boundaries (`clock.getLoop()`) and recalculates `nextBeatTime`/`currentBeat` when the playhead wraps.

4. **[P2] `Metronome.dispose()` prematurely disconnects output**  
   `dispose()` immediately calls `gainNode.disconnect()`. If playback is stopped while a 30ms tick is playing, this hard disconnect will cause an immediate audio pop.  
   *Action:* Apply a short linear fade-out (e.g., `setTargetAtTime(0, ctx.currentTime, 0.01)`) in `silence()` and wait for ticks to decay before fully disconnecting nodes.

5. **[P3] `TransportClock.seek()` accepts negative values**  
   Seeking to negative seconds is not clamped. Negative positions will cause `TempoMap.secondsToBBT()` to calculate negative bars/beats (e.g., `-1.-1.000`), breaking the UI text display.  
   *Action:* Clamp the `seconds` argument in `seek()` using `Math.max(0, seconds)`.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
