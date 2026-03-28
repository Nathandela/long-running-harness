REVIEW_CHANGES_REQUESTED

---

**1. [P1] `enabled` flag not enforced in `scheduleStep`**

`arpeggiator.ts:168` — `scheduleStep` never checks `params.enabled`. If a caller drives the arpeggiator while it's disabled, note events will still fire. The `enabled` field is dead state inside the engine. Either guard at the top of `scheduleStep`:
```ts
if (!params.enabled) return;
```
or document clearly that callers are solely responsible for gating — but then remove `enabled` from `ArpParams` since it belongs in caller logic.

---

**2. [P2] Compile-time sync check is a no-op**

`arpeggiator-schema.ts:38-41`:
```ts
const _syncCheck: _SchemaType = {} as ArpParams;
const _reverseCheck: ArpParams = {} as _SchemaType;
```
`as` casts bypass structural checks. If a field is added to `ArpParams` but omitted from the schema, this will still compile. The check provides false confidence. Use direct assignment without cast:
```ts
const _syncCheck: _SchemaType = null as unknown as ArpParams;
const _reverseCheck: ArpParams = null as unknown as _SchemaType;
```
These fail at compile time when types diverge.

---

**3. [P2] `latchSnapshot` not updated on `noteOff` — stale notes enter latch pool**

`arpeggiator.ts:147-158` — The snapshot is only taken on `noteOn`. Scenario: press 60, 64, 72 (snapshot = [60,64,72]), release 72 (no snapshot update), release 64 (no snapshot update), release 60 → `latchedNotes = [60,64,72]` but 72 and 64 were released before the latch triggered. A note that was explicitly released still ends up latched. Update the snapshot on `noteOff` as well:
```ts
heldNotes.splice(idx, 1);
if (params.latch) latchSnapshot = heldNotes.map((h) => ({ ...h }));
```

---

**4. [P3] `stepIndex` (swing) and `stepCounter` (pattern) can drift out of sync**

`arpeggiator.ts:168-179` — Swing uses the external `stepIndex` for even/odd detection, while pattern position uses the internal `stepCounter`. If the external scheduler resets its counter (e.g., transport restart) without calling `arp.reset()`, swing phase and pattern position become desynchronized. Consider using `stepCounter` for swing parity instead of `stepIndex`, or drop the `stepIndex` parameter entirely.

---

**5. [P3] `noteOn` accepts out-of-range MIDI values silently**

`arpeggiator.ts:139` — No validation on `note` (0–127) or `velocity` (0–127). Out-of-range notes propagate to the output `ArpNoteEvent` where downstream audio code may fail silently or clip. The octave-expansion code already filters notes `> 127` (correctly), but values like `note = -1` from root held notes still emit negative MIDI numbers from `scheduleStep` if octave direction is `"down"`.
