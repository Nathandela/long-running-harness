# Test Coverage Gaps

## Goal
Identify and fill test coverage gaps, focusing on audio-critical paths:
1. DSP algorithms: verify oscillator pitch via FFT, filter frequency response, envelope shape
2. Transport state machine: exhaustive state transition coverage
3. Session save/load: round-trip serialization with Zod validation
4. Clip operations: split, trim, move with offset arithmetic verification
5. Solo/mute state machine: all combination states
6. Voice allocation: polyphony limit, stealing, crossfade
7. Cycle detection: test with complex routing topologies
8. OfflineAudioContext-based deterministic audio tests

Add missing tests. Do not modify existing passing tests. Output `IMPROVED` if new tests were added and all pass. Output `NO_IMPROVEMENT` if coverage is already comprehensive. Output `FAILED` if new tests fail.

## Validation
- `pnpm test` passes (all tests, including newly added)
- No test uses mocked AudioContext when OfflineAudioContext could be used for deterministic verification
