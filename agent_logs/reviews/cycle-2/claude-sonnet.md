All 6 findings are addressed:

- **P1 (race)**: `setAudioStarted(true)` now inside `.then()` fulfillment handler — DawShell only renders after engine is running.
- **P1 (unhandled rejection)**: Two-argument `.then(onFulfilled, onRejected)` form — rejection sets `engineStatus("error")` and clears `engineRef`.
- **P2 (sync throw)**: `createAudioEngine()` wrapped in try/catch — sets `"error"` status on unsupported platforms.
- **P2 (Atomics)**: Layout comment now documents the Float32/Float64 restriction with guidance on Int32Array/BigInt64Array views.
- **P2 (BPM validation)**: Clamped 20–999, NaN/non-finite guarded correctly (`Math.max/min` propagates NaN, caught by `Number.isFinite`).
- **P3 (padding)**: `// Bytes 9-11: alignment padding (reserved, do not use)` comment added.

Bonus fixes (double-click guard, `useEffect` cleanup for HMR, `e.preventDefault()` on Space) are all correct.

REVIEW_APPROVED
