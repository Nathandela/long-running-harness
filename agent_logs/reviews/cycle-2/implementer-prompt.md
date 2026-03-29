You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
All four findings resolved. Type check passes.

REVIEW_APPROVED
</claude-sonnet-review>

<claude-opus-review>
All six findings addressed. Verification:

| # | Finding | Status |
|---|---------|--------|
| 1 | Buffer cache never evicts | Fixed: `syncBuffers` evicts entries for removed clips |
| 2 | `onAdvanceCallback` not cleared on unmount | Fixed: cleanup returns `transport.setOnAdvanceCallback(null)`, type widened to accept `null` |
| 3 | Unnecessary `as unknown as AudioNode` cast | Fixed: now just `strip.inputGain` |
| 4 | Duplicate concurrent fetches | Fixed: `inFlightRef` Set tracks in-flight sourceIds |
| 5 | Inline callbacks in render body | Fixed: extracted `SynthTrackPanel` with `useMemo`-wrapped callbacks |
| 6 | Audio tracks have no cleanup entry | Fixed: `addAudioTrack` now registers `mixer.removeStrip` in `trackCleanups` |

Bonus: the `alive` Set was replaced with a `trackGeneration` counter map, which correctly handles add-remove-add races for the same trackId.

One minor note: for audio tracks, `removeStrip` is called twice in `handleTrackRemoved` (once from the cleanup, once directly at line 156), but `removeStrip` guards with `if (!strip) return` so the second call is a harmless no-op. Not worth blocking on.

Tests pass, types check clean.

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
1. [P3] DrumKit parameter desynchronization: This issue remains unresolved. In `src/audio/track-audio-bridge.ts`, `addDrumTrack` still initializes `DrumKit` with default parameters (`const kit = createDrumKit(ctx, samples);`). There is no mechanism to sync the kit's initial state with the values stored in `paramsCache` from `src/ui/panels.tsx` if the audio bridge is re-created, resulting in the audio engine resetting to defaults while the UI retains its cached parameter values.
</gemini-review>

<codex-review>
REVIEW_CHANGES_REQUESTED

- **[P1] Failed buffer prefetches can permanently wedge a source ID in the clip-scheduler cache path** ([TrackAudioBridgeProvider.tsx:58](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:58), [TrackAudioBridgeProvider.tsx:59](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:59), [TrackAudioBridgeProvider.tsx:60](/Users/Nathan/Documents/Code/long-running-harness/src/audio/TrackAudioBridgeProvider.tsx:60))  
  The new `inFlightRef` guard is only cleared in `.then()`. If `pool.getAudioBuffer()` rejects, that `sourceId` stays in `inFlightRef` forever, so later sync passes will never retry the load and clips for that source can remain unschedulable until the provider remounts. This also risks an unhandled rejection. Clear the flag in a `finally`, handle the rejection explicitly, and add a regression test that fails once and then retries successfully on a later store update.

- **[P1] `pnpm test` is still red on the current branch** ([lfo.test.ts:21](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/dsp/lfo.test.ts:21), [lfo.test.ts:36](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/dsp/lfo.test.ts:36), [polyblep.test.ts:39](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/dsp/polyblep.test.ts:39), [polyblep.test.ts:56](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/dsp/polyblep.test.ts:56), [polyblep.test.ts:87](/Users/Nathan/Documents/Code/long-running-harness/src/audio/synth/dsp/polyblep.test.ts:87))  
  The current `pnpm test` run exits non-zero with five DSP timeout failures, so the branch still does not pass the project quality gate.</codex-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
