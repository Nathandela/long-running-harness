Based on my review of the modulation system changes (E12), here are my findings:

REVIEW_CHANGES_REQUESTED

---

**1. P1 — Modulation routes never reach the AudioWorklet (feature is entirely non-functional)**

`getWorkletRoutes()` and `instrument.setModRoutes()` are both implemented, but nothing connects the Zustand modulation store to the synth instrument. No subscriber or bridge calls `getWorkletRoutes(trackId)` and forwards the result to `instrument.setModRoutes(routes)` when routes change. The UI works, persistence works, but modulation has zero effect on audio output. This is the core deliverable of E12 and it's missing.

**2. P2 — Drag state leaks when mouse released outside component**

`ModulationMatrix.tsx`: `dragSource` is only cleared by `onMouseUp` on the container `div`. If the user drags off the component and releases, `dragSource` stays set — the next `mousedown` on any source port then reads a stale value. Needs a `document`-level `mouseup` listener (e.g. in a `useEffect`).

**3. P2 — Session hydration bypasses route type safety**

`hydrateStore` (`use-session-persistence.ts:131-148`) constructs `matrices` with `source: string` / `destination: string`, then calls `useModulationStore.setState({ matrices })`. The store's type expects `ModSource` / `ModDestination`. When `getWorkletRoutes` is eventually wired up, `SOURCE_INDEX[r.source]` on a `string`-typed value can produce `undefined` as `sourceIdx`, which the worklet would receive silently. The Zod validation in `recoverSession` provides runtime safety, but the types should be cast explicitly after schema parse.

**4. P2 — MAX_MOD_ROUTES not enforced on session load**

`addRoute` guards against >32 routes, but `hydrateStore` calls `useModulationStore.setState({ matrices })` directly, bypassing that guard. A crafted session file can load unlimited routes, feeding an unbounded `modRoutes` array into `process()`.

**5. P3 — `isPerVoiceSource` is dead code**

`modulation-types.ts:30-32` defines `isPerVoiceSource`, but `synth-processor.ts` hardcodes the same per-voice/global split with explicit `SOURCE_INDEX` comparisons. The function is never called. If a source is added, the processor's inline checks must be updated separately — a maintenance trap.

**6. P3 — SVG cable positions are pixel-hardcoded**

`ModulationMatrix.tsx:201-202`: `srcY = 20 + srcIdx * 22` / `destY = 20 + destIdx * 22` — hardcoded pixel offsets that don't measure actual port positions. Any token or spacing change will misalign cables.
