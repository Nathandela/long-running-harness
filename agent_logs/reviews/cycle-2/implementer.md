All checks pass. 

FIXES_APPLIED

**Summary:** Fixed the P1 Codex finding — drum machine parameter state (tune/decay/volume/tone) was resetting on track switch because params were initialized from `DEFAULT_INSTRUMENT_PARAMS` on every mount. Added a module-level `paramsCache` Map alongside the existing `sequencerCache` to persist params per `trackId`. The `onParamChange` callback now writes through to the cache. Added a regression test that changes a param, switches away, switches back, and verifies the value is preserved.
