You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. [P2] Buffer cache grows unboundedly — memory leak**
`TrackAudioBridgeProvider.tsx:44` — `bufferCacheRef` accumulates `AudioBuffer` entries (uncompressed PCM, potentially 10s–100s of MB each) and never evicts them when clips are deleted from the store. The subscribe callback only adds, never removes. In a live session with frequent clip edits this will bloat memory. Fix: subscribe to clip removals and `bufferCacheRef.current.delete(clip.sourceId)` when a sourceId is no longer referenced by any clip.

**2. [P2] `addAudioTrack` never registers a cleanup — mixer strip leaks on `dispose()`**
`track-audio-bridge.ts:130-133` — `addAudioTrack` calls `mixer.getOrCreateStrip` but doesn't add an entry to `trackCleanups`. When `bridge.dispose()` runs, the loop over `trackCleanups.values()` skips audio tracks, so `mixer.removeStrip` is never called for them. They leak until `EffectsBridgeProvider` disposes the whole mixer. Fix: add `trackCleanups.set(trackId, () => mixer.removeStrip(trackId))` in `addAudioTrack`.

**3. [P3] Unnecessary `as unknown as AudioNode` cast**
`TrackAudioBridgeProvider.tsx:106` — `strip.inputGain` is a `GainNode`, which extends `AudioNode`. The double-cast through `unknown` is not needed; `scheduleClips` accepts `AudioNode`. Remove the cast.

**4. [P3] `alive` set carried for drum/audio tracks but never consulted**
`track-audio-bridge.ts:117,131` — `alive.add(trackId)` is called in `addDrumTrack` and `addAudioTrack`, but `alive.has(trackId)` is only checked inside the async instrument creation callback (lines 95). For drum and audio tracks the flag is never read, making the intent opaque. Either document why it's added (e.g. "reserved for future async loading") or remove it from those paths to keep the invariant clear.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P1 — Buffer cache never evicts** (`TrackAudioBridgeProvider.tsx:44`): `bufferCacheRef` grows unboundedly. When clips are deleted from the store, their `AudioBuffer` entries remain cached. For projects with many clip add/remove cycles, this leaks potentially large audio buffers. Fix: subscribe to clip removals and evict stale `sourceId` entries, or use a WeakRef-based cache.

2. **P1 — `onAdvanceCallback` not cleared on unmount** (`TrackAudioBridgeProvider.tsx:69-111`): The effect calls `transport.setOnAdvanceCallback(cb)` but has no cleanup return. On unmount, the transport retains a stale closure that references the disposed `clipScheduler` and `bufferCacheRef`. If transport fires after unmount (hot reload, StrictMode remount delay), it will call `scheduleClips` on a dead scheduler. Fix: add `return () => transport.setOnAdvanceCallback(null);` to the effect.

3. **P2 — Unnecessary double cast** (`TrackAudioBridgeProvider.tsx:106`): `strip.inputGain as unknown as AudioNode` — `GainNode` already extends `AudioNode`, so `strip.inputGain` is directly assignable. The `as unknown` intermediate defeats type safety. Fix: remove the cast entirely.

4. **P2 — Duplicate concurrent fetches for same sourceId** (`TrackAudioBridgeProvider.tsx:48-55`): The store subscription fires `pool.getAudioBuffer(sourceId)` for every clip not yet in cache. Because the check is synchronous (`has()`) but the fetch is async, rapid store updates can trigger multiple concurrent fetches for the same `sourceId` before the first resolves. Fix: track in-flight `sourceId`s in a `Set<string>` alongside the cache.

5. **P2 — Inline callbacks in render body** (`panels.tsx:238-252`): `onNoteOn` and `onNoteOff` are created as new arrow functions on every render of `InstrumentPanel`, not memoized with `useCallback`. Each render passes new references to `SynthEditor`, causing unnecessary child re-renders. Fix: extract into `useCallback` with `[instrument]` dependency, or hoist the instrument lookup + callbacks into a child component.

6. **P3 — Audio tracks have no cleanup entry** (`track-audio-bridge.ts:130-133`): `addAudioTrack` registers in `alive` and creates a mixer strip, but does not add an entry to `trackCleanups`. While `handleTrackRemoved` still calls `mixer.removeStrip`, the asymmetry with instrument/drum tracks is surprising and makes future refactoring error-prone. Consider adding an empty cleanup for consistency.
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
Error executing tool grep_search: Path does not exist: /Users/Nathan/Documents/Code/long-running-harness/src/audio/mixer/channel-strip.ts
REVIEW_CHANGES_REQUESTED
1. [P1] Race condition causing instrument memory leak: In `src/audio/track-audio-bridge.ts` (`addInstrumentTrack`), `createSynthInstrument` resolves asynchronously. If a track is rapidly removed and re-added before the promise resolves, `alive.has(trackId)` will evaluate to true for both resolutions. The second resolution will overwrite the `instruments` and `trackCleanups` map entries, leaving the first `SynthInstrument` orphaned, permanently connected to the mixer, and leaking memory/audio. Use a unique instance ID or generation token instead of checking `alive.has(trackId)`.
2. [P2] AudioBuffer memory leak: In `src/audio/TrackAudioBridgeProvider.tsx`, `bufferCacheRef` caches `AudioBuffer`s for every audio clip ever added to the DAW. However, there is no logic to evict buffers from this cache when clips are deleted or modified. Over time, dragging and deleting multiple audio clips will cause the cache to grow indefinitely.
3. [P3] DrumKit parameter desynchronization: `SynthInstrument` correctly synchronizes its initial parameters from the state store upon creation. However, `addDrumTrack` initializes the `DrumKit` with default parameters without syncing with the local `paramsCache` defined in `src/ui/panels.tsx`. If the audio bridge is re-created, the `DrumKit` resets to defaults while the UI retains its cached values.
4. [P3] Unsafe type casting: In `src/audio/TrackAudioBridgeProvider.tsx`, `strip.inputGain as unknown as AudioNode` bypasses TypeScript's type checking. `strip.inputGain` is typed as a `GainNode`, which extends `AudioNode`. This dirty cast hides underlying type configuration issues and could lead to runtime errors if `inputGain` is refactored.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
