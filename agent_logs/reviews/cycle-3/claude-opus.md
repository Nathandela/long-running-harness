All 8 DrumPad tests pass. The change is clean:

- Filters `onPointerDown` to primary button only (`e.button === 0`) -- correct
- Adds explicit `onKeyDown` for Enter/Space with `preventDefault()` -- correct
- Tests cover all three new behaviors

REVIEW_APPROVED
