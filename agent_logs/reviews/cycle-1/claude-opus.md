I have all the information I need. Here's my consolidated review:

REVIEW_CHANGES_REQUESTED

1. **P1 — `secondsToBBT` tick overflow to 480** (`src/audio/tempo-map.ts:68`). `Math.round(fractionalBeat * 480)` produces 480 when `fractionalBeat` is close to 1.0 (e.g., 0.999). Tick must be 0–479. Fix: use `Math.floor()`, or handle the 480 case by incrementing beat/bar.

2. **P1 — `useTransportShortcuts` re-registers command on every state change** (`src/ui/transport/useTransportShortcuts.ts:37`). `transportState` is in the dependency array, so every play/stop unregisters+re-registers the shortcut binding. During the brief gap, a keypress could be dropped. Fix: store `transportState` in a ref, read from ref inside `execute`, remove from deps.

3. **P2 — `seek()` accepts negative seconds** (`src/audio/transport-clock.ts:110`). No clamp to `>= 0`. Negative cursor produces garbage BBT (negative bars). Add `Math.max(0, seconds)`.

4. **P2 — `beatsPerBar` captured once at init** (`src/audio/use-transport.ts:68`). `const beatsPerBar = clock.getTempoMap().timeSignature.numerator` is closed over in the scheduler callback. If time signature or BPM changes, `beatsPerBar` stays stale — downbeat detection breaks after a `setBpm` call since `setBpm` creates a new `TempoMap` but the callback still reads the old numerator.

5. **P2 — Metronome oscillators never disconnected** (`src/audio/metronome.ts:39-43`). Stopped oscillators remain connected to the gain node. The Web Audio spec will eventually GC them, but explicit cleanup via `osc.onended = () => osc.disconnect()` reduces GC pressure in long sessions with hundreds of ticks/minute.

6. **P2 — `getCursorSeconds()` mutates anchor state as a side effect** (`src/audio/transport-clock.ts:142-144`). A "get" method silently re-anchors `playStartContextTime` and `playStartCursorSeconds` during loop wrap. If called multiple times in the same frame (e.g., by both the scheduler and cursor display), the second call computes from a re-anchored baseline — the position will be subtly different. Either document explicitly or split into `getCursorSeconds()` (pure read) and `advanceCursor()` (mutating).

7. **P3 — SAB Float64 cursor writes are non-atomic** (`src/audio/transport-clock.ts:73-74`, documented at `shared-buffer-layout.ts:29-31`). Currently safe because reads happen on the same thread. When an AudioWorklet reads the SAB in the future, torn reads on Float64 are possible. Tracking issue recommended.

8. **P3 — No test for tick=480 edge case** (`src/audio/tempo-map.test.ts`). The round-trip test at line 106 uses clean values (0.25, 0.5, etc.) that never trigger the rounding boundary. Add a test with a value like `0.4999s` at 120 BPM to catch the overflow.
