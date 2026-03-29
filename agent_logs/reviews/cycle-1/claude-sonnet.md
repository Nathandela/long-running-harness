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
