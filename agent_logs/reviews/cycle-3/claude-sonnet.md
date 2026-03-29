The latest commit closes the residual edge case: the previous fix only set `didDragRef` in `handlePointerMove`, so clicking an existing point without moving still added a duplicate. Now `didDragRef.current = true` is set immediately on hit in `handlePointerDown`, suppressing the follow-up `click`. The regression test confirms the fix. The `setPointerCapture` guard and analyser mock additions are clean.

All findings from the review cycle are resolved.

REVIEW_APPROVED
