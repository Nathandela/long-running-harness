REVIEW_CHANGES_REQUESTED

---

**1. [P1] Unhandled rejection in `handleStart` — silent audio failure**
`src/App.tsx:19` — `void engine.resume().then(...)` discards any rejection. If the browser blocks audio context resume (autoplay policy, permissions), the error is silently swallowed, `engineStatus` is never set to `"error"`, and the DawShell renders with no indication anything went wrong. The store has an `"error"` state that is never reachable from this code path.

**2. [P1] `setAudioStarted(true)` called before `resume()` resolves**
`src/App.tsx:19–22` — DawShell renders immediately while the engine is still `suspended`. `engineStatus` in the store remains `"uninitialized"` until the async resolve. Any DawShell child that reads `engineStatus` and branches on `"running"` will get the wrong state on first render. Fix: move `setAudioStarted(true)` into the `.then()` callback, after `setEngineStatus("running")`.

**3. [P2] `createAudioEngine()` can throw synchronously, uncaught**
`src/App.tsx:17` — `new AudioContext()` throws on platforms without Web Audio support and in certain browser environments. No try/catch wraps this call; an uncaught exception here crashes the whole app with no error UI.

**4. [P2] `Float32`/`Float64` fields in `SharedArrayBuffer` cannot use `Atomics`**
`src/audio/shared-buffer-layout.ts` — The module comment says "lock-free audio-thread → UI-thread communication," but `Atomics` only works with integer-typed arrays (`Int32Array`, `BigInt64Array`, etc.), not `Float32Array` or `Float64Array`. `CURSOR_SECONDS` (Float64) and `BPM` (Float32) cannot be atomically read/written without a mutex or a separate integer-representation trick. This is a correctness trap for any AudioWorklet that tries to implement the INV-3 "lock-free" invariant against these offsets.

**5. [P2] `setBpm` accepts invalid values without guarding**
`src/state/store.ts:57–59` — BPM of `0`, negative values, or `NaN` will be stored and later used in beat-timing calculations (60/bpm), causing division-by-zero or `Infinity`. No validation.

**6. [P3] Undocumented 3-byte padding in `TransportLayout`**
`src/audio/shared-buffer-layout.ts:30–32` — There are 3 silent padding bytes between `STATE` (Uint8 at offset 8) and `BPM` (Float32 at offset 12). The layout comment doesn't document this gap. Future implementors writing to byte 9–11 thinking it's free would corrupt BPM alignment.
