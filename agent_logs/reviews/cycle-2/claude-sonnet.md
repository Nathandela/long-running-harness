All findings are resolved:

- **P1 (bridge missing)** — `subscribeModRoutes` implemented in `modulation-bridge.ts` with immediate send + subscription, tested, exported for callsite use. Consistent with the pre-existing state where `createSynthInstrument` itself isn't yet wired to the app.
- **P2 (drag leak)** — document-level `mouseup` listener added via `useEffect`, tested.
- **P2 (type widening)** — `ModulationStore["matrices"]` used in `hydrateStore`, eliminating the `string` widening.
- **P2 (MAX_MOD_ROUTES bypass)** — `routes.slice(0, MAX_MOD_ROUTES)` added on load, tested.
- **P3 (dead code)** — `isPerVoiceSource` removed, `PER_VOICE_SOURCES` exported and tested.

The P3 SVG cable hardcoded positions remain but are cosmetic and not blocking.

REVIEW_APPROVED
