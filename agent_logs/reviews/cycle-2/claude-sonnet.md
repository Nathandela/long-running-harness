All P1 and P2 findings from the prior review are resolved:

- **P1 left-edge resize**: Fixed — `edge: "left" | "right"` field added; left drag now adjusts both `startTime` and `duration` with a `BatchNoteCommand` on pointer-up.
- **P2 MoveNoteCommand sentinel bug**: Fixed — switched to `undefined` sentinel.
- **P2 registry useMemo churn**: Fixed — now depends only on `deleteSelectedNotes`.
- **P3 pitchToY dead params**: Fixed — signature cleaned to `(pitch, view)`.

Remaining P3 items (velocity-bar no handler, module-level `noteCounter`/`nextNoteId`) are pre-existing and not regressions.

REVIEW_APPROVED
