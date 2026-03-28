Now I have enough context. Let me compile findings.

REVIEW_CHANGES_REQUESTED

---

**1. [P0] Double `useTransport()` instantiation — keyboard shortcuts and UI operate on separate clocks**

`DawShell` calls `useTransportShortcuts(registry, shortcuts)` (line 13 in `DawShell.tsx`), which internally calls `useTransport()`. It also renders `<Toolbar />` → `<TransportBar />` which calls `useTransport()` independently. Each `useTransport()` call creates its own `TransportClock`, `LookAheadScheduler`, `Metronome`, and `SharedArrayBuffer` via the `useEffect` on mount. The spacebar shortcut operates on clock A; the UI play/stop buttons operate on clock B. They're completely independent — two metronomes will fire, two schedulers will run. `useTransport()` must be lifted to context or the shortcut hook must accept the transport as a prop.

---

**2. [P1] Cursor display stuck at 0 during playback**

`useTransportCursor` (`src/ui/hooks/useTransportCursor.ts:24`) reads `CURSOR_SECONDS` from the SAB in an RAF loop. But `writeSABCursor` is only called inside `getCursorSeconds()`, `pause()`, `stop()`, and `seek()`. Nothing calls `getCursorSeconds()` periodically during playback — the `use-transport.ts` play callback calls `clock.play()` and `storePlay()` but no RAF or interval that drives the SAB write. The cursor display reads a stale SAB value (0 or the last pause position) for the entire play duration.

Fix: drive the SAB cursor write from the same RAF loop that reads it, or add an RAF in `use-transport.ts` while playing that calls `getCursorSeconds()` (which already writes the SAB as a side-effect).

---

**3. [P2] `useTransportShortcuts` re-registers and rebinds on every state transition**

`transportState` is in the `useEffect` dependency array (`useTransportShortcuts.ts:37`). Every play/pause/stop triggers an unregister + re-register + rebind cycle. The command's `execute` closure already captures the current state correctly; `transportState` only needs to be in the closure, not the deps. Use a ref for `transportState` or restructure the command to delegate to transport functions that check state internally.

---

**4. [P2] `getCursorSeconds()` mutates SAB and re-anchors playback state as a side-effect**

`transport-clock.ts:143-145` re-anchors `playStartContextTime` and `playStartCursorSeconds` on loop wrap inside a read-only accessor. Side-effecting getters are a correctness hazard: calling the function for display purposes alters the reference frame for all subsequent timing calculations. If two callers invoke `getCursorSeconds()` at different `ctx.currentTime` values within the same frame (once from the future RAF, once from scheduler), the second call computes position relative to the re-anchor made by the first. Separate the display-read path from the loop-wrap state mutation.

---

**5. [P3] `TempoMap.secondsToSamples()` returns a float**

`tempo-map.ts:53`: `return seconds * sampleRate` — returns a non-integer for most inputs. Any consumer expecting an integer sample offset will silently get a float. Should return `Math.round(seconds * sampleRate)` or callers must document the truncation responsibility. Currently unused, but will bite when wired to the scheduler.
