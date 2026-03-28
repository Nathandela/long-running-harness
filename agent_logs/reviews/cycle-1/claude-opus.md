REVIEW_CHANGES_REQUESTED

1. **P1 — No AudioContext cleanup on unmount** (`src/App.tsx:16-23`). `createAudioEngine()` is called in `handleStart` and stored in a ref, but there is no `useEffect` cleanup that calls `engine.close()` when the App unmounts. This leaks the AudioContext (browsers limit to ~6 simultaneous contexts). Add a cleanup effect.

2. **P1 — `resume()` error not handled** (`src/App.tsx:19-21`). `void engine.resume().then(...)` discards rejections. If `resume()` throws (e.g., user denies autoplay), the app shows `DawShell` with a broken audio engine and `engineStatus` stuck on whatever it was. Needs a `.catch()` that calls `setEngineStatus("error")` and potentially reverts `audioStarted`.

3. **P2 — `handleStart` can be called multiple times** (`src/App.tsx:16-23`). The `useCallback` creates a new `AudioContext` each invocation. While the UI flow currently prevents double-click (screen changes on `setAudioStarted(true)`), a fast double-click or re-render race could create two contexts. Guard with `if (engineRef.current) return;`.

4. **P2 — No BPM validation** (`src/state/store.ts:57-59`). `setBpm` accepts any number including negative, zero, NaN, or Infinity. At minimum clamp to a sane range (e.g., 20-999).

5. **P3 — `engineRef` is never read** (`src/App.tsx:13`). The ref is set but never consumed — no cleanup, no passing to children. It's dead code unless future work uses it. Minor, but track it.

6. **P3 — Shell scripts committed to repo root** (`infinity-loop.sh`, `polish-loop.sh`, `brutalwav-pipeline.sh`). These are agent orchestration scripts (936 lines, 572 lines) that appear to be harness-specific tooling, not application code. Consider `.gitignore` or moving to a `scripts/` directory. The `improve/` directory with TODO-style markdown files is similarly loose.
