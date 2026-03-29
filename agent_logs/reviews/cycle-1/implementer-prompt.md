You received feedback from independent code reviewers. Analyze and implement all fixes.

First, load your context:
```bash
npx ca load-session
```

<claude-sonnet-review>
REVIEW_CHANGES_REQUESTED

---

**1. [P2] `soloIsolate` is not covered in `computeSessionBounds` integration tests**

`bounce-engine.ts:56` handles `soloIsolate` in `getAudibleTrackIds`, but no test in `bounce-workflow.test.ts` exercises this path. The solo test at `bounce-workflow.test.ts:55` only has tracks with `solo: true` and the default `soloIsolate: false`. A track with `soloIsolate: true` should remain audible during a solo bounce — this contract is untested.

```ts
// Missing test:
it("solo mode audible includes soloIsolate tracks", () => {
  const t1 = makeTrack({ id: "t1", clipIds: ["c1"], solo: true });
  const t2 = makeTrack({ id: "t2", clipIds: ["c2"] });
  const t3 = makeTrack({ id: "t3", clipIds: ["c3"], soloIsolate: true });
  // t3 should appear in bounds despite not being soloed
```

**2. [P2] `exponentialRampToValueAtTime` mock accepts `v <= 0` silently**

`helpers.ts:44` — the mock just does `param.value = v` for all values. The real Web Audio API throws `DOMException` for `v <= 0`. Production code in `drum-kit.ts:69` and `bounce-engine.ts:354` both pass `0.001`, which is safe now, but a future regression passing `0` (e.g. a fade-to-zero) would pass these tests incorrectly.

**3. [P2] Loop wrap assertion is too loose**

`transport-scheduler.test.ts` "loop wrap re-syncs scheduler beat phase" asserts:
```ts
expect(clock.getCursorSeconds()).toBeLessThan(0.5);
```
After advancing 1.1s into a 1.0s loop, the cursor should wrap to ~0.1s. The `< 0.5` bound would still pass even if the wrap math was significantly wrong. Should be `toBeCloseTo(0.1, 1)`.

**4. [P2] "BPM change" test doesn't exercise scheduler integration**

`transport-scheduler.test.ts` "BPM change updates tempo map for scheduler" only asserts `clock.getTempoMap().secondsPerBeat() ≈ 1.0`. This checks the clock in isolation — the scheduler is created and started but its beat timing at the new BPM is never verified. The test name claims to verify scheduler behavior but the assertions don't reach the scheduler.

**5. [P3] `mockPanner()` and `mockCompressor()` return untyped `object`**

`helpers.ts:66,80` — `mockPanner()` returns `object`, `mockCompressor()` returns `object`, while `mockGainNode()` returns the typed `MockGainNode`. TypeScript cannot check `.pan.value` or `.threshold.value` accesses on untyped objects. Add typed interfaces for consistency.

**6. [P3] `copyFromChannel: vi.fn()` inconsistency**

`helpers.ts:153` — `copyFromChannel` is a no-op mock while `copyToChannel` has a real implementation. Bounce engine only calls `getChannelData()`, so this doesn't cause test failures, but the asymmetry is misleading and leaves a silent trap if any future code calls `copyFromChannel` to read data back.
</claude-sonnet-review>

<claude-opus-review>
All 47 tests pass, TypeScript compiles cleanly, and the auto-commit (872d43b) contains no source changes (only agent logs).

REVIEW_APPROVED

Minor observations (non-blocking):

1. **P3** `helpers.ts:178` - Module-level `idCounter` is not reset in `transport-scheduler.test.ts` or `mixer-integration.test.ts`. Not a bug today because those files don't call factory functions, but a future contributor adding a `makeTrack()` call there would get surprising IDs.

2. **P3** `bounce-workflow.test.ts:220-231` - `drainGenerator` returns `result: unknown`, forcing every call site to cast (e.g., `as { blob: Blob; duration: number }`). Could use the actual `BounceResult` type from `@audio/bounce/types` to preserve type safety within tests.

3. **P3** `helpers.ts:46-48` - `linearRampToValueAtTime` and `exponentialRampToValueAtTime` mocks set `param.value` instantly. Acceptable simplification for integration tests, but worth a comment if someone later writes tests that depend on ramp timing behavior.
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


Fix ALL P0 and P1 findings. Address P2 where reasonable. Commit fixes.
Run tests to verify. Output FIXES_APPLIED when done.
