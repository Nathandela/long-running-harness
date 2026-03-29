The P2 is fixed with the exact approach recommended. The `state.tracks !== prev.tracks` broad check has been replaced with structural-only checks (`length` and ID order), and `sequencerCache.get` has been replaced with `getOrCreateSequencer` so drum tracks play before the UI panel is opened.

REVIEW_APPROVED
