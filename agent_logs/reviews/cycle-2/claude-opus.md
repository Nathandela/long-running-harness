All three findings are resolved:

1. **P2 (RotaryKnob display)**: Fixed — now shows `{valueText ?? String(value)}`, restoring units.
2. **P3 (ToggleGroup button type)**: Fixed — `type="button"` added.
3. **P3 (Silent catch)**: Fixed — now logs `console.warn("Failed to prefetch buffer:", clip.sourceId, err)`.

REVIEW_APPROVED
