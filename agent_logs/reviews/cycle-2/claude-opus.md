All three findings are addressed:

1. **P2 override reset** — Fixed elegantly by scoping the override to a specific track ID (`mediaPoolOverrideTrackId`). When the selected track changes, `showMediaPoolOverride` becomes `false` automatically without needing an effect. New test covers the exact scenario (toggle on instrument track, switch to audio, switch to different instrument track).

2. **P3 multi-select ambiguity** — Now uses `selectedTrackIds[0]` consistently via scoped selectors instead of `.find()`, making the behavior explicit and deterministic.

3. **P3 style duplication** — Extracted shared properties into `panelBtnBase` and spread into both buttons.

Bonus: the instrument/drum panel now has `height: 240` matching the piano roll panel, fixing potential layout jitter.

REVIEW_APPROVED
