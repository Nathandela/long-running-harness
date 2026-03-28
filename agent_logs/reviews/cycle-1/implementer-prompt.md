You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. [P1] Unhandled rejection in `handleStart` — silent audio failure**
`src/App.tsx:19` — `void engine.resume().then(...)` discards any rejection. If the browser blocks audio context resume (autoplay policy, permissions), the error is silently swallowed, `engineStatus` is never set to `"error"`, and the DawShell renders with no indication anything went wrong. The store has an `"error"` state that is never reachable from this code path.

**2. [P1] `setAudioStarted(true)` called before `resume()` resolves**
`src/App.tsx:19–22` — DawShell renders immediately while the engine is still `suspended`. `engineStatus` in the store remains `"uninitialized"` until the async resolve. Any DawShell child that reads `engineStatus` and branches on `"running"` will get the wrong state on first render. Fix: move `setAudioStarted(true)` into the `.then()` callback, after `setEngineStatus("running")`.

**3. [P2] `createAudioEngine()` can throw synchronously, uncaught**
`src/App.tsx:17` — `new AudioContext()` throws on platforms without Web Audio support and in certain browser environments. No try/catch wraps this call; an uncaught exception here crashes the whole app with no error UI.

**4. [P2] `Float32`/`Float64` fields in `SharedArrayBuffer` cannot use `Atomics`**
`src/audio/shared-buffer-layout.ts` — The module comment says "lock-free audio-thread → UI-thread communication," but `Atomics` only works with integer-typed arrays (`Int32Array`, `BigInt64Array`, etc.), not `Float32Array` or `Float64Array`. `CURSOR_SECONDS` (Float64) and `BPM` (Float32) cannot be atomically read/written without a mutex or a separate integer-representation trick. This is a correctness trap for any AudioWorklet that tries to implement the INV-3 "lock-free" invariant against these offsets.

**5. [P2] `setBpm` accepts invalid values without guarding**
`src/state/store.ts:57–59` — BPM of `0`, negative values, or `NaN` will be stored and later used in beat-timing calculations (60/bpm), causing division-by-zero or `Infinity`. No validation.

**6. [P3] Undocumented 3-byte padding in `TransportLayout`**
`src/audio/shared-buffer-layout.ts:30–32` — There are 3 silent padding bytes between `STATE` (Uint8 at offset 8) and `BPM` (Float32 at offset 12). The layout comment doesn't document this gap. Future implementors writing to byte 9–11 thinking it's free would corrupt BPM alignment.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P1 — No AudioContext cleanup on unmount** (`src/App.tsx:16-23`). `createAudioEngine()` is called in `handleStart` and stored in a ref, but there is no `useEffect` cleanup that calls `engine.close()` when the App unmounts. This leaks the AudioContext (browsers limit to ~6 simultaneous contexts). Add a cleanup effect.

2. **P1 — `resume()` error not handled** (`src/App.tsx:19-21`). `void engine.resume().then(...)` discards rejections. If `resume()` throws (e.g., user denies autoplay), the app shows `DawShell` with a broken audio engine and `engineStatus` stuck on whatever it was. Needs a `.catch()` that calls `setEngineStatus("error")` and potentially reverts `audioStarted`.

3. **P2 — `handleStart` can be called multiple times** (`src/App.tsx:16-23`). The `useCallback` creates a new `AudioContext` each invocation. While the UI flow currently prevents double-click (screen changes on `setAudioStarted(true)`), a fast double-click or re-render race could create two contexts. Guard with `if (engineRef.current) return;`.

4. **P2 — No BPM validation** (`src/state/store.ts:57-59`). `setBpm` accepts any number including negative, zero, NaN, or Infinity. At minimum clamp to a sane range (e.g., 20-999).

5. **P3 — `engineRef` is never read** (`src/App.tsx:13`). The ref is set but never consumed — no cleanup, no passing to children. It's dead code unless future work uses it. Minor, but track it.

6. **P3 — Shell scripts committed to repo root** (`infinity-loop.sh`, `polish-loop.sh`, `brutalwav-pipeline.sh`). These are agent orchestration scripts (936 lines, 572 lines) that appear to be harness-specific tooling, not application code. Consider `.gitignore` or moving to a `scripts/` directory. The `improve/` directory with TODO-style markdown files is similarly loose.
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

1. **P2 - AudioContext Memory Leak (HMR)**: In `src/App.tsx`, the `AudioContext` created in `handleStart` is never closed when the component unmounts. During development, Vite's HMR will remount the application and leak an active `AudioContext` on each reload. Browsers enforce a strict hardware limit (typically 6 contexts per page), so this will quickly break audio playback during development. Add a `useEffect` cleanup function to call `engineRef.current?.close()`.
2. **P2 - Unhandled Promise Rejection**: In `src/App.tsx`, `engine.resume()` is called without a `.catch()` block. If the browser blocks or rejects the resume operation, it will result in an unhandled promise rejection and leave the UI state out of sync. You should chain a `.catch()` block that updates the store via `setEngineStatus("error")`.
3. **P3 - Missing `preventDefault`**: In `src/ui/ClickToStart.tsx`, the `onKeyDown` handler checks for the Space key (`e.key === " "`) but does not call `e.preventDefault()`. It's a best practice for custom interactive elements to prevent the default page scrolling behavior associated with the spacebar.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
