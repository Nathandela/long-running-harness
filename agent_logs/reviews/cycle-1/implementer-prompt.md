You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. P2 — `addDrumTrack` caches rejected synthesis promise permanently**

`src/audio/track-audio-bridge.ts:127`

```ts
void getOrSynthesize808Samples(ctx).then((samples) => { ... });
```

No `.catch()`. If `synthesize808Samples` rejects (e.g., `OfflineAudioContext` unavailable, OOM), `sampleCachePromise` permanently holds the rejected promise — every subsequent drum track silently never gets a kit. The drum machine UI renders but produces no audio, with no error surfaced.

Fix: add `.catch((err) => { console.error('808 synthesis failed:', err); sampleCachePromise = null; })` so failures reset the cache and are visible.

---

**2. P2 — `renderOffline` fallback path ties AudioBuffer to a specific `AudioContext`**

`src/audio/drum-machine/drum-synthesis.ts:24`

```ts
const out = targetCtx.createBuffer(1, length, SAMPLE_RATE);
```

When `targetCtx.sampleRate !== 44100` (macOS defaults to 48000 Hz in some configs), the synthesized buffers are created via `targetCtx.createBuffer()`. These are stored in the module-level `sampleCachePromise`. If the engine's `AudioContext` is ever recreated, the new `getOrSynthesize808Samples(newCtx)` call returns the cached buffers from the closed context.

Note: 44100 Hz contexts return the `OfflineAudioContext`-produced buffer (context-independent) — this path is safe. Only the `sampleRate !== 44100` branch is affected.

Also the comment "Copy to target context's sample rate" is wrong — the output buffer's sample rate is still `SAMPLE_RATE` (44100), not `targetCtx.sampleRate`. SRC happens at playback.

---

**3. P3 — `bridgeRef` module singleton races during React StrictMode remount**

`src/ui/panels.tsx:62-67`, `src/ui/panels.tsx:337-341`

StrictMode's intentional double-mount runs: `setBridgeRef(bridge)` → `setBridgeRef(null)` (cleanup) → `setBridgeRef(bridge)`. Any `setInterval` drum trigger that fires during the null window silently drops (the guard `if (!bridge) return` swallows it). Not a production issue but breaks expected behavior in development.

Longer term, a module-level singleton for a React-lifecycle-managed value is fragile; prefer a context or ref passed to sequencer callbacks.

---

**4. P3 — `ArrangementPanel` playback RAF loop uses stale closure values**

`src/ui/arrangement/ArrangementPanel.tsx:224-252`

The inline `tick` function in the playback RAF branch directly captures `view`, `tracks`, `clips`, `selectedClipIds`, `bpm`, `automationLanes`, `clipPeaks` from the outer closure (stale after mount). This is correct by design — when those change, `render` (a dep) changes, restarting the effect with fresh values. But the `eslint-disable` comment only says "deps trigger effect restart" without explaining the mechanism. If someone later adds state to the tick that isn't a dep of `render`, it'll silently use stale values. The pattern should be documented more explicitly.
</claude-sonnet-review>

<claude-opus-review>
All tests pass. Here's my review:

REVIEW_CHANGES_REQUESTED

1. **P2 — `sampleCachePromise` ignores AudioContext identity** (`src/audio/track-audio-bridge.ts:66-76`). The module-level `sampleCachePromise` caches based on the first `AudioContext` ever passed. If the AudioContext is re-created (e.g., after `close()` due to user gesture policies or hardware changes), stale samples from the old context are returned. Fix: key the cache by `AudioContext` instance (e.g., `WeakMap<AudioContext, Promise<...>>`).

2. **P2 — `renderOffline` sample rate branch is a no-op copy** (`src/audio/drum-machine/drum-synthesis.ts:23-26`). When `targetCtx.sampleRate !== SAMPLE_RATE`, the code creates a new buffer at... the same 44100 Hz sample rate and copies the same data. This doesn't actually resample. The comment "Copy to target context's sample rate" is misleading. WebAudio resamples on playback, so this works by accident. Either remove the dead branch or implement proper resampling with `OfflineAudioContext` at the target rate.

3. **P2 — Module-level `bridgeRef` is fragile singleton** (`src/ui/panels.tsx:63-68`). The `bridgeRef` global is set/cleared by `InstrumentPanel`'s effect. If multiple `InstrumentPanel` instances ever mount (HMR, route transitions), the last to unmount nulls it, silencing all drum triggers. Consider passing the bridge through the sequencer factory or a context instead.

4. **P3 — Mixer forwarding effect skips initial values for new tracks** (`src/audio/TrackAudioBridgeProvider.tsx:166-186`). The `if (!prev) continue;` guard means a newly added track's initial volume/pan/mute/solo are never forwarded to the mixer. Works today because both sides start at defaults, but any future non-default-initialized track would silently desync. Add an initialization path for new tracks.

5. **P3 — Double `removeStrip` call for audio tracks** (`src/audio/track-audio-bridge.ts:145,168`). `addAudioTrack` sets a cleanup that calls `mixer.removeStrip()`, then `handleTrackRemoved` also calls `mixer.removeStrip()`. Safe due to the null guard but asymmetric with instrument/drum tracks. Move `removeStrip` out of the audio track cleanup to match the pattern.

6. **P3 — `useTransportCursor` RAF loop runs even when transport is stopped** (`src/ui/hooks/useTransportCursor.ts:24-31`). The RAF tick runs continuously as long as a `transportSAB` exists, polling every frame even when paused/stopped. In `ArrangementPanel`, a second RAF loop also polls during playback. Consider gating the cursor hook's RAF on transport state, or at minimum, documenting the intentional overlap.
</claude-opus-review>

<gemini-review>
YOLO mode is enabled. All tool calls will be automatically approved.
YOLO mode is enabled. All tool calls will be automatically approved.
[ERROR] [IDEConnectionUtils] IDE fetch failed for http://127.0.0.1:53978/mcp TypeError: fetch failed
    at Object.processResponse (/usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:237:16)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:1081:19
    at node:internal/process/task_queues:151:7
    at AsyncResource.runInAsyncScope (node:async_hooks:214:14)
    at AsyncResource.runMicrotask (node:internal/process/task_queues:148:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/index.js:157:7
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/ide/ide-connection-utils.js:233:30
    at async StreamableHTTPClientTransport.send (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js:306:30) {
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:53978
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1636:16) {
    errno: -61,
    code: 'ECONNREFUSED',
    syscall: 'connect',
    address: '127.0.0.1',
    port: 53978
  }
}
[ERROR] [IDEConnectionUtils] IDE fetch failed for http://127.0.0.1:53978/mcp TypeError: fetch failed
    at Object.processResponse (/usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:237:16)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/lib/web/fetch/index.js:1081:19
    at node:internal/process/task_queues:151:7
    at AsyncResource.runInAsyncScope (node:async_hooks:214:14)
    at AsyncResource.runMicrotask (node:internal/process/task_queues:148:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at /usr/local/lib/node_modules/@google/gemini-cli/node_modules/undici/index.js:157:7
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/ide/ide-connection-utils.js:233:30
    at async StreamableHTTPClientTransport.send (file:///usr/local/lib/node_modules/@google/gemini-cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js:306:30) {
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:53978
      at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1636:16) {
    errno: -61,
    code: 'ECONNREFUSED',
    syscall: 'connect',
    address: '127.0.0.1',
    port: 53978
  }
}
[ERROR] [IDEClient] Failed to connect to IDE companion extension in IDE. Please ensure the extension is running. To install the extension, run /ide install.
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
1. **[P0] Drum Machine pattern playback stops when track is unselected**: In `src/ui/panels.tsx`, the drum step sequencer audio scheduling is implemented inside the `useDrumMachineState` React hook. Because this hook is called from `DrumMachineController` (which is only mounted in `InstrumentPanel` when the drum track is currently selected), selecting any other track unmounts the component, clears the interval, and stops drum playback completely. Drum pattern scheduling needs to be moved to a persistent, central service (such as `TrackAudioBridgeProvider` or `useAudioEngine`) so that it plays regardless of UI selection.
2. **[P1] Initial mixer properties not applied for new/loaded tracks**: In `src/audio/TrackAudioBridgeProvider.tsx`, the track property forwarding `useEffect` has a bug where it skips properties if a track wasn't in the previous state (`if (!prev) continue;`). When a project is loaded or a track is newly created with non-default initial values (e.g. volume or pan), this skips sending those initial values to the `MixerEngine`. The mixer strip remains at default settings (volume 1.0, pan center) until the user adjusts the track's controls. This check should instead apply properties if `!prev` or if they differ.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
