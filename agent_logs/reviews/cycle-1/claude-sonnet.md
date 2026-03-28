REVIEW_CHANGES_REQUESTED

---

**1. P1 — `cleanup()` unconditionally kills all playing clips**
`src/audio/mixer/clip-scheduler.ts:122-132`

The method comment says "if source has ended" but there is no such check. `gainNode.disconnect()` is called for every entry — playing or not — and the exception swallow masks nothing (Web Audio `disconnect` doesn't throw for active nodes). Any call to `cleanup()` during playback will abruptly silence all clips. The `stopAll()` method is the correct path for a deliberate stop; `cleanup()` should only remove entries whose `source` has already ended (no reliable Web Audio API for this — the `ended` event + `scheduled.delete` in the listener already handles it, making `cleanup()` either a no-op or destructive).

---

**2. P1 — Time coordinate mismatch in clip-scheduler**
`src/audio/mixer/clip-scheduler.ts:55, 71, 80, 93`

`clip.startTime` is "seconds on the song timeline" (`ClipModel` type comment confirms this). `windowStart`/`windowEnd` are AudioContext seconds (`ctx.currentTime + lookAheadSec` from the existing `LookAheadScheduler`). These are different coordinate spaces. `TransportClock` uses `playStartContextTime` and `playStartCursorSeconds` to convert between them. The scheduler must convert song time to AudioContext time before comparing and before passing to `source.start()`. As written, clips will never schedule correctly in practice (AudioContext time ≠ 0 at play start).

---

**3. P2 — MixerEngine never instantiated; all audio control is dead code**
`src/audio/mixer/mixer-engine.ts`, `src/ui/mixer/MixerPanel.tsx`

`createMixerEngine` is never called outside tests. `setFaderLevel`, `setMute`, `setSolo`, `updateSoloState`, and `emergencyMute` have no callers in production code. `MixerPanel` writes fader/pan/mute/solo to Zustand store but the audio engine is never told. Metering is hardcoded to `0` in `MixerPanel`. The mixer UI is a cosmetic shell with no audio effect.

---

**4. P2 — `setSolo()` requires manual `updateSoloState()` to take effect**
`src/audio/mixer/mixer-engine.ts:162-177`

`setSolo()` sets the flag but does not apply mute consequences. The caller must additionally call `updateSoloState()`. This two-step API is undocumented on the type and easy to misuse — toggling solo without the follow-up call leaves the mix in an inconsistent state. Either `setSolo()` should call `updateSoloState()` internally, or the type should document the requirement explicitly.

---

**5. P2 — No guard for overlapping fadeIn + fadeOut**
`src/audio/mixer/clip-scheduler.ts:69-86`

When `clip.fadeIn + clip.fadeOut > clip.duration`, `fadeOutStart < clip.startTime + clip.fadeIn`. The `setValueAtTime(clip.gain, fadeOutStart)` writes a value in the middle of the fade-in ramp, clobbering it. Web Audio automation ordering is deterministic but the result is a glitched gain curve. No validation is done on `ClipModel` fields before scheduling.

---

**6. P3 — `logarithmicTaper` misnamed**
`src/audio/mixer/mixer-engine.ts:20-29`

Uses `x²` (polynomial) for `[0,1]` and linear for `[1,2]`. The function name and comment both say "logarithmic", which is incorrect. Minor, but misleading for anyone tuning the taper curve later.

---

**7. P3 — `RoutingGraph`/`hasCycle` is dead code in production**
`src/audio/mixer/cycle-detection.ts`

Exported from the index but never instantiated or called in any production module. The commit message attributes it to E13 (future epic). It should at minimum have a `// Used by E13` comment in the index export to signal intent, or be deferred until E13.
