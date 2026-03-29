All review findings resolved:

- **P2 findings (#1-#5)**: Already fixed in prior commit (filter init, LFO cleanup, concurrency guard, sample rate, imports)
- **P3 #6 WAV conformance**: Fixed - IEEE float fmt chunk now uses 18-byte sub-chunk with `cbSize=0`, header grows to 46 bytes for float format

All 1323 tests pass, TypeScript compiles cleanly, lint passes.

FIXES_APPLIED
