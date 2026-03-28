# Audio Safety Hardening

## Goal
Verify and harden all audio safety invariants across the codebase. Check that:
1. The master bus hard limiter (INV-2) exists, is non-bypassable, and is the final node before destination
2. DFS cycle detection (INV-1) runs before EVERY AudioNode.connect() call -- including preset loads, session loads, and programmatic graph construction
3. Voice pool has a fixed ceiling (INV-5) with no runtime growth
4. AudioWorklet process() methods contain zero heap allocations (INV-3) -- no `new Array`, `new Float32Array`, no object creation
5. Transport stop guarantees silence within 10ms (INV-6)
6. Gain parameters are clamped to maximum +12dB
7. Emergency mute activates on sustained clipping (>500ms)

After each check, fix any violations found. Output `IMPROVED` if fixes were made and all tests pass. Output `NO_IMPROVEMENT` if all invariants already hold. Output `FAILED` if fixes were attempted but tests fail.

## Validation
- `pnpm check` passes (lint + type check)
- `pnpm test` passes (all existing tests)
- No AudioNode.connect() call exists without a preceding cycle detection check
- No `new` keyword appears in any AudioWorkletProcessor.process() method body
- Hard limiter node exists in the master bus chain with the correct DynamicsCompressorNode parameters
