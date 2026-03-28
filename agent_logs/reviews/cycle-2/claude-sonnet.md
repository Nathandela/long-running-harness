REVIEW_CHANGES_REQUESTED

Fixed: #2 (chorus LFO stop). These remain open:

**1. P1 — Effects-to-audio bridge still missing**

No code subscribes to `useEffectsStore` changes and calls `MixerEngine.addInsert()` / `removeInsert()`. `createEffectRegistry` is still unused outside tests. The effects rack updates Zustand state only — no audio nodes are ever inserted into the signal chain. Effects are entirely visual.

**2. P1 — Effects state still not persisted**

`storeToSession()` and `hydrateStore()` in `use-session-persistence.ts` still do not read from or write to `useEffectsStore`. The session schema's `effects` field remains dead. Effects are lost on every page reload.

**3. P2 — Reverb IR still regenerated synchronously on every decay change**

`reverb.ts:applyParam` for `"decay"` still calls `generateImpulseResponse(ctx, value)` — allocating and filling a large `AudioBuffer` synchronously on every knob event. Unchanged from the original commit.

**4. P2 — `insert-chain.ts` rewire still uses `source.disconnect()` with no arguments**

Still severs all connections from source, not just the insert chain connection. Unchanged.
