The fix correctly replaces the size-comparison guard with a proper ID diff, and the regression tests cover both the same-size replacement and partial replacement cases. All three issues from my earlier review were addressed in `71160c3`, and this follow-up commit resolves the same-size replacement edge case with test coverage.

REVIEW_APPROVED
