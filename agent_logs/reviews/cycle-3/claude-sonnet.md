The fix correctly addresses fade-out gain when seeking into an active fade-out region. The math checks out:

- `fadeOutStartInClip = duration - maxFadeOut` correctly identifies when the seek lands inside the fade-out
- `fadeOutProgress = (seekOffset - fadeOutStartInClip) / maxFadeOut` gives the linear interpolation position
- `startGain = clip.gain * (1 - fadeOutProgress)` mirrors the fade-in partial-gain pattern
- The clamping from `e1258eb` (`maxFadeIn + maxFadeOut <= duration`) ensures fade-in and fade-out automation can never conflict simultaneously — if `seekOffset >= fadeOutStartInClip >= maxFadeIn`, the fade-in branch is unreachable

Test coverage is precise and verifies the exact gain value at the seek point.

REVIEW_APPROVED
