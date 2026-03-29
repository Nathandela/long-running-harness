All hooks pass, commit successful.

FIXES_APPLIED

**Summary of fixes:**

1. **[P1] Duplicate point on click** (`AutomationLaneEditor.tsx:97`): Set `didDragRef.current = true` in `handlePointerDown` when a hit is detected, not only on pointer move. This prevents `handleClick` from inserting a new point when you click an existing point without dragging. Added regression test with mocked `getBoundingClientRect`.

2. **[P1] Tests red - missing analyser mock** (`App.test.tsx:80`): Added `getFloatTimeDomainData`, `getByteTimeDomainData`, and `getByteFrequencyData` to the mock `createAnalyser()` return value, fixing the `TypeError` that was breaking App-level tests.

3. **Guard `setPointerCapture`** (`AutomationLaneEditor.tsx:100`): Added runtime check before calling `setPointerCapture` since jsdom doesn't implement it, preventing unhandled exceptions in tests.
