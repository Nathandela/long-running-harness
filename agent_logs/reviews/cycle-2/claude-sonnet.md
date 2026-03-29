All P2 issues are fixed. Checking the one remaining open finding.

The `@audio/mixer` export of `faderTaper` is confirmed at line 17 — the linter-enforced import change is valid.

**Remaining open finding from original review:**

**6. [P3] `wav-encoder.ts:37,49` — IEEE float WAV fmt chunk still non-conformant**

Not addressed. `WAVE_FORMAT_IEEE_FLOAT` (code 3) with a 16-byte fmt sub-chunk is technically non-conformant; the spec requires 18 bytes (with `cbSize=0`). Fix is two lines: change the sub-chunk size field from 16 to 18 and append `view.setUint16(36, 0, true)` for `cbSize`, shifting the `data` chunk to offset 38. The `44`-byte total header becomes 46 bytes.

---

All P2 findings (#1 filter init, #2 LFO hot-path, #3 concurrent bounce guard) and P3 findings #4/#5 are resolved. Only the P3 WAV conformance issue remains.

REVIEW_CHANGES_REQUESTED
