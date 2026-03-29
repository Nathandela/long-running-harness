All three findings resolved:

1. **P2 (RotaryKnob display)**: `{valueText ?? String(value)}` — units now visible.
2. **P3 (ToggleGroup button type)**: `type="button"` present.
3. **P3 (Silent catch)**: `console.warn` with sourceId and error. Additionally, a stale-cache guard was added (lines 63-72) — good defensive improvement.

REVIEW_APPROVED
