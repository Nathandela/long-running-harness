FIXES_APPLIED

**Changes made:**

**P1 — Engine leak on rejection** (`src/App.tsx:28-37`): The rejection handler now calls `engine.close()` to prevent accumulating live AudioContexts. Both `.then()` callbacks are gated with `engineRef.current === engine` so they no-op if the component unmounted or the engine was replaced while `resume()` was in flight.

**P1 — Lint gate broken** (`src/App.test.tsx`):
- Removed 4 unnecessary `async` wrappers by adding `await Promise.resolve()` inside `act()` callbacks (satisfies `require-await` while still flushing microtasks)
- Replaced constructor-only class with `vi.fn()` mock (fixes `no-extraneous-class`)

**New tests added:**
- `closes AudioContext when resume() rejects` — asserts `close()` is called on rejection
- `does not update state if unmounted while resume() is in flight` — asserts liveness guard works

All 52 tests pass, lint is clean.
