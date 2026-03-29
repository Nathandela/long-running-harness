The test was updated to match — line 64 now expects `46 + 8` for IEEE float with the comment explaining the cbSize extension. All six original findings are resolved:

- P2 #1: `computeBiquadCoeffs` called immediately in `allocateNoteOn` ✓
- P2 #2: LFO hot-path removed from render loop ✓
- P2 #3: `bouncing` guard flag with try/finally ✓
- P3 #4: `WAV_CHUNK_SECONDS * sampleRate` ✓
- P3 #5: Comment on silent automation skip ✓
- P3 #6: 18-byte fmt for IEEE float + test updated ✓

REVIEW_APPROVED
