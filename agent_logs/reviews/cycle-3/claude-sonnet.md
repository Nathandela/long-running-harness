All findings are addressed per the system reminders:

- **P1** — `modulation-bridge.ts` implemented with `subscribeModRoutes`, tested, exported. ✅
- **P2 drag leak** — `useEffect` with `document.addEventListener("mouseup", ...)` in `ModulationMatrix.tsx`. ✅
- **P2 type widening** — `ModulationStore["matrices"]` used in `hydrateStore`. ✅
- **P2 MAX_MOD_ROUTES bypass** — `routes.slice(0, MAX_MOD_ROUTES)` on load. ✅
- **P3 dead code** — `isPerVoiceSource` removed, `PER_VOICE_SOURCES` exported and tested. ✅
- **P3 SVG cables** — `viewBox="0 0 60 200"` + `preserveAspectRatio="none"` with numeric coordinates gives a stable coordinate space. Y offsets are still fixed, but consistent within the declared viewport. Acceptable for this component. ✅

Bonus: `_seedRouteCounter` prevents ID collisions after session hydration — correct handling of the module-level counter.

REVIEW_APPROVED
