You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. P1 — `cleanup()` unconditionally kills all playing clips**
`src/audio/mixer/clip-scheduler.ts:122-132`

The method comment says "if source has ended" but there is no such check. `gainNode.disconnect()` is called for every entry — playing or not — and the exception swallow masks nothing (Web Audio `disconnect` doesn't throw for active nodes). Any call to `cleanup()` during playback will abruptly silence all clips. The `stopAll()` method is the correct path for a deliberate stop; `cleanup()` should only remove entries whose `source` has already ended (no reliable Web Audio API for this — the `ended` event + `scheduled.delete` in the listener already handles it, making `cleanup()` either a no-op or destructive).

---

**2. P1 — Time coordinate mismatch in clip-scheduler**
`src/audio/mixer/clip-scheduler.ts:55, 71, 80, 93`

`clip.startTime` is "seconds on the song timeline" (`ClipModel` type comment confirms this). `windowStart`/`windowEnd` are AudioContext seconds (`ctx.currentTime + lookAheadSec` from the existing `LookAheadScheduler`). These are different coordinate spaces. `TransportClock` uses `playStartContextTime` and `playStartCursorSeconds` to convert between them. The scheduler must convert song time to AudioContext time before comparing and before passing to `source.start()`. As written, clips will never schedule correctly in practice (AudioContext time ≠ 0 at play start).

---

**3. P2 — MixerEngine never instantiated; all audio control is dead code**
`src/audio/mixer/mixer-engine.ts`, `src/ui/mixer/MixerPanel.tsx`

`createMixerEngine` is never called outside tests. `setFaderLevel`, `setMute`, `setSolo`, `updateSoloState`, and `emergencyMute` have no callers in production code. `MixerPanel` writes fader/pan/mute/solo to Zustand store but the audio engine is never told. Metering is hardcoded to `0` in `MixerPanel`. The mixer UI is a cosmetic shell with no audio effect.

---

**4. P2 — `setSolo()` requires manual `updateSoloState()` to take effect**
`src/audio/mixer/mixer-engine.ts:162-177`

`setSolo()` sets the flag but does not apply mute consequences. The caller must additionally call `updateSoloState()`. This two-step API is undocumented on the type and easy to misuse — toggling solo without the follow-up call leaves the mix in an inconsistent state. Either `setSolo()` should call `updateSoloState()` internally, or the type should document the requirement explicitly.

---

**5. P2 — No guard for overlapping fadeIn + fadeOut**
`src/audio/mixer/clip-scheduler.ts:69-86`

When `clip.fadeIn + clip.fadeOut > clip.duration`, `fadeOutStart < clip.startTime + clip.fadeIn`. The `setValueAtTime(clip.gain, fadeOutStart)` writes a value in the middle of the fade-in ramp, clobbering it. Web Audio automation ordering is deterministic but the result is a glitched gain curve. No validation is done on `ClipModel` fields before scheduling.

---

**6. P3 — `logarithmicTaper` misnamed**
`src/audio/mixer/mixer-engine.ts:20-29`

Uses `x²` (polynomial) for `[0,1]` and linear for `[1,2]`. The function name and comment both say "logarithmic", which is incorrect. Minor, but misleading for anyone tuning the taper curve later.

---

**7. P3 — `RoutingGraph`/`hasCycle` is dead code in production**
`src/audio/mixer/cycle-detection.ts`

Exported from the index but never instantiated or called in any production module. The commit message attributes it to E13 (future epic). It should at minimum have a `// Used by E13` comment in the index export to signal intent, or be deferred until E13.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

1. **P1 — `cleanup()` in `clip-scheduler.ts:122-133` is broken.** The method claims to clean up only ended clips, but `gainNode.disconnect()` never throws whether the source is playing or not. The try/catch is a no-op. In practice, calling `cleanup()` disconnects and removes ALL entries including actively playing clips, silencing audio mid-playback. The logic needs an actual "is this source done?" check (e.g., track playback state or check against `ctx.currentTime`).

2. **P1 — `setSolo()` in `mixer-engine.ts:162-166` doesn't update audio routing.** `setMute()` calls `applyMuteState()` immediately, but `setSolo()` does not. This asymmetry means calling `setSolo("track-1", true)` has no audible effect until someone separately calls `updateSoloState()`. Either `setSolo` should call `updateSoloState()` internally (like `setMute` calls `applyMuteState`), or the inconsistency should be documented as intentional with a rationale.

3. **P2 — `MixerPanel.tsx:34-48` — Callbacks with `tracks` in dependency arrays.** `handleMuteToggle` and `handleSoloToggle` include `tracks` (the full array) in their `useCallback` deps. Since the array reference changes on every mutation, these callbacks recreate on every track update, causing all `ChannelStrip` children to re-render. Fix: read from `useDawStore.getState()` inside the callback body instead of closing over the `tracks` selector.

4. **P2 — `clip-scheduler.ts` uses `ClipModel.startTime` as AudioContext time.** `ClipModel.startTime` is typed/documented as "seconds on timeline" (`types.ts:24`), but the scheduler passes it directly to `source.start(clip.startTime, ...)` and `gainNode.gain.setValueAtTime(0, clip.startTime)`, both of which require AudioContext-relative time. If the caller doesn't pre-convert, fades and playback will be scheduled at the wrong time. Either: (a) accept a pre-converted type distinct from `ClipModel`, or (b) accept a time offset parameter and do the conversion inside the scheduler.

5. **P3 — `volumeToDb` duplicated.** Identical function in `ChannelStrip.tsx:30` and `MasterStrip.tsx:19`. Extract to a shared utility.
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
Error executing tool read_file: Path not in workspace: Attempted path "/tmp/audio.diff" resolves outside the allowed workspace directories: /Users/Nathan/Documents/Code/long-running-harness or the project temp directory: /Users/Nathan/.gemini/tmp/long-running-harness
REVIEW_CHANGES_REQUESTED

1. **[P0] `clip-scheduler.ts` Time Coordinate Mismatch**: `scheduleClips` compares `clip.startTime` (which is in arrangement time) to `windowStart` and `windowEnd` (which are in `AudioContext` time). It then schedules nodes (`source.start(...)` and gain ramps) using arrangement time directly. The scheduler must explicitly map arrangement time into `AudioContext` time before scheduling.
2. **[P0] `clip-scheduler.ts` Ignores Mid-Clip Playback**: The check `if (clip.startTime < windowStart || clip.startTime >= windowEnd)` skips the clip entirely if the transport playhead seeks into the middle of it. The scheduler must check for an overlap (`clip.startTime < windowEnd && clip.startTime + clip.duration > windowStart`) and compute the correct `sourceOffset` for the `start()` call.
3. **[P1] `clip-scheduler.ts` Fails to Re-schedule Looping Clips**: Scheduled clips are tracked by `clip.id` in a Map and are only removed asynchronously upon the `ended` event. If a short transport loop causes a clip to re-trigger before the previous instance's `ended` event fires, `scheduled.has(clip.id)` will evaluate to `true` and block playback. Track active nodes using a unique iteration ID or instance ID rather than the static `clip.id`.
4. **[P1] `mixer-engine.ts` API Inconsistency for Solo State**: Unlike `setMute` which automatically invokes `applyMuteState`, `setSolo` and `setSoloIsolate` only update internal booleans. This forces consumers to manually call `updateSoloState()` to reflect the new graph topology. Both methods should internally trigger `updateSoloState()`.
5. **[P2] `clip-scheduler.ts` Fade-Out Bound Exception**: If `clip.fadeOut` is longer than `clip.duration`, `fadeOutStart` computes to a time earlier than the node's `clip.startTime`. Scheduling `setValueAtTime` in the past throws `InvalidStateError` and produces audio glitches. Clamp `clip.fadeOut` to `Math.min(clip.fadeOut, clip.duration)`.
6. **[P2] Mixer Engine is Not Hooked Up**: `createMixerEngine` is implemented and its types are exported, but it is never instantiated or integrated into `DawStore` or `AudioEngineProvider`. The mixer panel UI updates the Zustand store successfully, but it does not drive the actual audio graph.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
