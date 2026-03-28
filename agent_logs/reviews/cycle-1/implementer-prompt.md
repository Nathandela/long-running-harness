You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

**1. P2 — Hardcoded sample rate in `freeverb.ts:132,154`**

```ts
const delayTime = delaySamples / 44100;  // wrong on 48kHz systems
```

`ctx.sampleRate` should be used instead of the literal `44100`. On 48kHz contexts (common on Windows, some Linux setups) all delay times are 8% shorter than intended, noticeably shifting the reverb character. `reverb.ts:43` uses `ctx.sampleRate` correctly.

---

**2. P2 — `width` parameter is a no-op but exposed in UI**

`freeverb.ts:217-219` — the `width` case in `applyParam` is an empty stub with a "potential future use" comment. The UI renders a fully interactive Width knob that controls nothing. Either implement it or remove the parameter so the UI doesn't mislead users.

---

**3. P3 — A/B swap silently resets all parameters to defaults**

`EffectsRack.tsx:handleSwapReverb` resets to `p.default` for every parameter on swap. If the user has dialed in a convolution reverb's mix/decay and hits A/B, those settings are discarded. The feature is called "A/B comparison" which implies preserving comparable settings. At minimum the `mix` value should be carried over.

---

**4. P3 — `replaceInsert` fallback-to-append is a silent error path**

`insert-chain.ts:83-86` — when the insert ID is not found, `replaceInsert` falls back to appending. This is the only caller path that could hit this (a type-swap on a slot already in the chain), so a missing ID indicates a logic error in the bridge. The fallback masks the bug; it should throw or at least warn, consistent with how `at()` is used elsewhere in the same file.
</claude-sonnet-review>

<claude-opus-review>
REVIEW_CHANGES_REQUESTED

**1. P1 — Allpass filter topology is incorrect, causes up to 5x gain boost**
`src/audio/effects/freeverb.ts:156` — The feedforward path connects `prevNode` (raw input `x[n]`) instead of the delay line's input sum (`v[n]`). This makes the 4 "allpass" stages NOT true allpass filters. The magnitude response ranges from 1.17x to 1.5x per stage (with g=0.5), meaning 4 cascaded stages produce between ~1.85x and **~5x gain** depending on frequency. This will cause audible frequency coloring and potential clipping.

Fix: Add an explicit sum node for the allpass and connect feedforward to it:
```typescript
const sum = ctx.createGain();
prevNode.connect(sum);           // x[n] -> sum
sum.connect(delay);              // sum -> delay (creates v[n-M])
delay.connect(feedback);         // v[n-M] * g
feedback.connect(sum);           // g*v[n-M] -> sum (now sum = v[n])
sum.connect(feedforward);        // -g * v[n] (correct!)
feedforward.connect(apOutput);
delay.connect(apOutput);         // + v[n-M]
```

**2. P2 — `width` parameter is a no-op exposed as UI control**
`src/audio/effects/freeverb.ts:204-205` — The "Width" parameter (0-100%) is defined in the schema and visible in the UI, but the `applyParam` handler does nothing with it (`break` with a comment about "potential stereo processing"). Users see a knob that has zero effect. Either implement stereo width or remove the parameter until implemented.

**3. P3 — `replaceInsert` disconnects output but not input of old insert**
`src/audio/mixer/insert-chain.ts:87-89` — Only `old.output.disconnect()` is called; `old.input.disconnect()` is skipped. Currently safe because the bridge calls `dispose()` on the effect first, but the chain should be self-contained. Minor since `rewire()` re-routes all connections anyway.
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

1. **[P0] Build Failure (TypeScript):** The `onSwapType` and `swapLabel` props added to `EffectPanelProps` in `src/ui/effects/EffectPanel.tsx` are defined as optional (e.g., `onSwapType?: () => void;`), but in `src/ui/effects/EffectsRack.tsx` they are explicitly passed as `undefined`. Due to `exactOptionalPropertyTypes: true` in `tsconfig.json`, this causes a compilation error (`error TS2375`). You must explicitly allow `undefined` in the prop definitions (e.g., `onSwapType?: (() => void) | undefined;` and `swapLabel?: string | undefined;`).
2. **[P2] Dead Parameter (Freeverb `width`):** The `width` parameter is defined, commented as controlling stereo spread, and wired to `applyParam` in `src/audio/effects/freeverb.ts`, but it does absolutely nothing to the audio signal. The effect is entirely mono/summed. The intended stereo spread implementation (like right-channel delay offsets) is missing.
3. **[P2] Incorrect Damping Implementation:** The `damping` parameter is implemented by globally reducing the comb filter feedback gain (`dampToCoeff`). True Schroeder damping requires a one-pole low-pass filter (a `BiquadFilterNode` with `type = "lowpass"`) inside the feedback loop of each comb filter so that high frequencies decay faster than low frequencies over time. The current implementation just incorrectly reduces the overall reverb tail length identically for all frequencies.
</gemini-review>


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
