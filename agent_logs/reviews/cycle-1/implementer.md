All fixes applied and committed. Here's the summary:

**P1 (all fixed):**
- `App.tsx`: `.resume()` rejection now caught, sets `engineStatus("error")`, nulls the ref
- `App.tsx`: `setAudioStarted(true)` moved inside `.then()` -- DawShell only renders after engine is running
- `App.tsx`: `useEffect` cleanup calls `engine.close()` on unmount (prevents AudioContext leak/HMR buildup)

**P2 (all addressed):**
- `App.tsx`: `createAudioEngine()` wrapped in try/catch for platforms without Web Audio
- `App.tsx`: `if (engineRef.current) return` guard prevents double-click race
- `store.ts`: `setBpm` clamps to 20-999 and rejects NaN/Infinity
- `ClickToStart.tsx`: `e.preventDefault()` on Space key
- `shared-buffer-layout.ts`: Documented Float32/Float64 Atomics limitation and padding bytes 9-11

50 tests pass, TypeScript and ESLint clean.

FIXES_APPLIED
