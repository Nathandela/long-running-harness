All previous findings are addressed, and the new commit adds correct fixes:

- Liveness guard (`engineRef.current !== engine`) prevents stale state updates after unmount during in-flight `resume()`.
- Rejection handler now calls `engine.close()` before clearing the ref, preventing the AudioContext leak.
- `setEngineStatus("error")` on rejection is still called unconditionally (correct — the error state should still be recorded regardless of liveness).

REVIEW_APPROVED
