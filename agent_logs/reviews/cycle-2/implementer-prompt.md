You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All five findings resolved:

- **P0**: `TransportProvider` wraps `DawShellInner`, providing a single `useTransportInit()` instance via context. `useTransport()` is now a context consumer — no more double instantiation.
- **P1**: `look-ahead-scheduler.ts::advance()` now calls `clock.updateCursor()` on every tick, driving continuous SAB writes during playback.
- **P2 (shortcuts churn)**: `stateRef` pattern eliminates `transportState` from `useEffect` deps.
- **P2 (getter side-effect)**: `getCursorSeconds()` is a pure read; `updateCursor()` owns SAB writes and loop-wrap state.
- **P3**: `secondsToSamples` uses `Math.round`.

Bonus fixes also landed: `seek()` clamps negatives to 0, oscillator nodes self-disconnect via `onended`, `dispose()` fades out gracefully, `beatsPerBar` read dynamically per tick, and `syncToPosition()` provides phase-correct beat alignment on play/resume.

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All 8 findings verified against the current code:

| # | Finding | Status |
|---|---------|--------|
| 1 | P1 tick overflow 480 | Fixed — `Math.floor` at `tempo-map.ts:68`, test added |
| 2 | P1 shortcut re-register | Fixed — `stateRef` pattern at `useTransportShortcuts.ts:17-18`, `transportState` removed from deps |
| 3 | P2 negative seek | Fixed — `Math.max(0, seconds)` at `transport-clock.ts:111` |
| 4 | P2 stale beatsPerBar | Fixed — read inside callback at `use-transport.ts:73` |
| 5 | P2 oscillator disconnect | Fixed — `osc.onended` at `metronome.ts:44`, plus fade-out in `dispose()` |
| 6 | P2 getCursorSeconds side effects | Fixed — split into pure `getCursorSeconds()` and mutating `updateCursor()`/`didLoopWrap()` |
| 7 | P3 SAB non-atomic | Acknowledged, not expected to fix now |
| 8 | P3 tick overflow test | Fixed — test at `tempo-map.test.ts:68-76` |

Bonus: the implementer also improved the scheduler with `syncToPosition()` for phase-correct beat alignment and loop-wrap resync, and extracted `TransportProvider`/`TransportCtx` to properly share a single transport instance via React context. Both are clean additions.

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

- **[P1] `useTransportShortcuts` mutates a ref during render, which both fails the lint gate and risks stale/uncommitted transport state in the shortcut handler** ([useTransportShortcuts.ts:17](/Users/Nathan/Documents/Code/long-running-harness/src/ui/transport/useTransportShortcuts.ts:17))  
  `stateRef.current = transportState` now runs on every render. The React refs rule rejects this, and the underlying issue is real: render-time ref writes can publish state from a render that never commits. Move the sync into an effect or switch to a React 19 pattern like `useEffectEvent`, then keep the command registration effect stable.

- **[P2] `metronome.ts` still breaks `pnpm lint` on two shorthand void-return callbacks** ([metronome.ts:44](/Users/Nathan/Documents/Code/long-running-harness/src/audio/metronome.ts:44), [metronome.ts:54](/Users/Nathan/Documents/Code/long-running-harness/src/audio/metronome.ts:54))  
  `pnpm test` passes, but `pnpm lint` fails because `osc.onended = () => osc.disconnect()` and `setTimeout(() => gainNode.disconnect(), 50)` violate `@typescript-eslint/no-confusing-void-expression`. Wrap both bodies in braces so the branch can pass the project quality gate.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
