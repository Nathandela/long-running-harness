`ArrangementPanel.tsx:166` populates `clipPeaks` keyed by `clip.id`, which matches the renderer at line 256. The key change in the test (`"src-1"` → `"c1"`) is correct.

All four findings are resolved:
- **#1 (P2)**: `{valueText ?? String(value)}` — fixed
- **#2 (P2)**: Arrow-key navigation + single-tabstop radiogroup — fixed
- **#3 (P3)**: `console.warn` with error info — fixed
- **#4 (P3)**: Exact 4-bar assertion + clip.id key alignment — fixed

REVIEW_APPROVED
