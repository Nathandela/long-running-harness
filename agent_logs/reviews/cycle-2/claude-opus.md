All 59 tests pass (up from 54). The fixes address real gaps:

1. **Enabled guard** (`arpeggiator.ts:180`): `scheduleStep` now early-returns when `!params.enabled`. Correct.
2. **MIDI clamping** (`arpeggiator.ts:129-130`): `noteOn` clamps note and velocity to 0-127 with rounding. Correct.
3. **Swing uses internal stepCounter** (`arpeggiator.ts:190`): Swing parity now uses `stepCounter % 2` instead of the external `stepIndex`, which is renamed to `_stepIndex`. Correct — ensures consistent swing regardless of caller's step numbering.
4. **Latch dynamic toggle** (`arpeggiator.ts:199,205-207`): `setParams` detects when latch is toggled on and snapshots currently held notes. Correct — handles the mid-chord latch enable case.
5. **Schema sync check** (`arpeggiator-schema.ts:39-40`): Changed from `{} as ArpParams` to `null as unknown as ArpParams` to avoid runtime object creation issues. Correct.

All fixes are minimal, well-tested, and correctly implemented.

REVIEW_APPROVED
