# Advisory Fleet Brief: BRUTALWAV

**Advisors consulted**: Security & Reliability (Claude Sonnet), Scalability & Performance (Gemini), Simplicity & Alternatives (Claude Opus)
**Advisors unavailable**: Organizational & Delivery (Codex -- timed out during execution)

---

## P0 Concerns

### 1. SharedArrayBuffer requires cross-origin isolation headers (Security)
The lock-free audio/UI communication via SharedArrayBuffer silently fails without `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`. The spec treats SAB as a given but this is a hard deployment constraint.
- **Action**: Promote to NFR. Add startup check: `crossOriginIsolated === true` or hard error. Document required server headers.

### 2. Memory exhaustion via fully-decoded AudioBuffers (Scalability)
A 5-minute stereo track at 44.1kHz/32-bit = ~105MB. 50 tracks = ~5.2GB. Browser tabs will crash.
- **Action**: Implement chunked streaming from IndexedDB/File System Access API. Use AudioBuffer only for short samples. Consider MediaElementAudioSourceNode for long backing tracks.

### 3. React re-render thrashing for 60fps metering (Scalability)
Feeding 60fps metering through Zustand/React state will cause massive render tree updates.
- **Action**: Bypass React state for high-frequency updates. Use requestAnimationFrame to read directly from SharedArrayBuffer and mutate raw DOM/canvas via useRef.

### 4. Feedback loop detection has no implementation contract (Security)
R-UNW-05 names the requirement but gives no implementation. Cycles cause runaway gain -- speaker/hearing damage.
- **Action**: Mandatory DFS cycle detection on every routing mutation. Reject the command before AudioNode connection is made.

### 5. Full analog-modeled 808 from scratch is the biggest complexity risk (Simplicity)
11 drum instruments, each a mini-synthesizer with AudioWorklet. 3-4x effort of sample-based drums with marginal perceptible benefit.
- **Action**: Ship with high-quality 808 samples + Tone/Decay/Tune knobs for tweakability. Make analog modeling a future epic.

### 6. "AudioWorklet for ALL DSP" is an over-constraint (Simplicity)
Native nodes (BiquadFilterNode, DynamicsCompressorNode, ConvolverNode, etc.) are C++ implementations -- faster and more battle-tested than JS AudioWorklet equivalents.
- **Action**: Relax R-UBI-02. Use native Web Audio nodes where they suffice. Reserve AudioWorklet for custom DSP only (synth voices, custom envelopes, modulation).

---

## P1 Concerns

### 7. AudioWorklet GC pauses will cause audio dropouts (Scalability)
Memory allocation in the process() loop triggers GC, causing immediate audio artifacts.
- **Action**: Mandate zero-allocation coding in AudioWorklet process(). Pre-allocate all buffers during initialization. Consider WASM for heavy DSP.

### 8. Decoded audio buffer size is unbounded (Security)
A 192kHz/32-bit/8-channel 60-minute FLAC = ~25GB decoded. DoS vector.
- **Action**: File size limit + estimated decoded size check before decodeAudioData. Reject oversized buffers.

### 9. Session JSON has no schema validation (Security)
JSON.parse of arbitrary input risks prototype pollution. Crafted sessions could produce invalid DSP topology.
- **Action**: Validate with Zod schema. Include schemaVersion. Recovery = load what validates, discard the rest.

### 10. OfflineAudioContext bounce is unbounded in memory (Security)
10-minute stereo at 48kHz = ~230MB for the raw buffer alone.
- **Action**: Chunked render strategy (30-second blocks), stream to FileSystemWritableFileStream.

### 11. MIDI input has no validation boundary (Security)
SysEx floods, out-of-range CC values passed to AudioParam could produce NaN/Infinity.
- **Action**: MIDI input validation layer: clamp all values, enforce max SysEx length, treat all MIDI as untrusted.

### 12. Modulation matrix is premature for v1 (Simplicity)
Full drag-to-connect routing is a major UI/DSP subsystem. Popular synths ship without it.
- **Action**: Hardwire standard modulation paths (filter env -> cutoff, LFO -> pitch/cutoff/amp, velocity -> filter/amp). Matrix deferred to later.

### 13. Full mixer routing (sidechain, sends, buses) on day one is scope creep (Simplicity)
Requires bus architecture, cycle detection, topological sort updates on every change.
- **Action**: v1 ships insert-only effects + master bus. Add sends/buses/sidechain as later epic.

### 14. Custom design system from scratch is high-effort, low-leverage (Simplicity)
Building every UI primitive (buttons, sliders, dropdowns, modals) from scratch absorbs 20-30% of UI time.
- **Action**: Start with shadcn/ui (Radix primitives) + brutalist theme. Custom-build only DAW-specific controls (knobs, faders, meters, piano roll).

### 15. 50-track session load < 2s is unrealistic without lazy loading (Scalability)
decodeAudioData is CPU-bound. 50 files takes >>2 seconds.
- **Action**: Lazy load. Persist pre-computed waveform peaks in IndexedDB. Render UI instantly, decode audio in background.

### 16. AudioWorklet quantum overrun has no degradation contract (Security)
Spec says "log and continue" but doesn't define what "continue" means.
- **Action**: Define: emit silence for that quantum, post overrun message, mute track after N consecutive overruns.

---

## P2 Concerns

### 17. DOM overload in piano roll and arrangement (Scalability)
Thousands of MIDI notes and waveform SVGs will overwhelm the layout engine.
- **Action**: Use HTML5 Canvas or WebGL for timeline, waveforms, and piano roll.

### 18. Look-ahead scheduler drift from main-thread blocking (Scalability)
setInterval on UI thread is vulnerable to React rendering blocks.
- **Action**: Move scheduler to a Web Worker or manage timing inside AudioWorklet.

### 19. Both convolution AND algorithmic reverb is redundant (Simplicity)
Two implementations, double the testing.
- **Action**: Ship ConvolverNode reverb only for v1. Add algorithmic later.

### 20. Arpeggiator is nice-to-have, not core (Simplicity)
Self-contained feature that doesn't block any workflow.
- **Action**: Defer. Piano roll covers manual arpeggio patterns.

### 21. IndexedDB writes aren't transactionally safe (Security)
Browser crash mid-write = corrupt session.
- **Action**: Write-then-swap pattern with session_draft -> session_current + session_backup.

### 22. Undo stack holds unbounded buffer references (Security)
Long sessions accumulate hundreds of commands holding AudioBuffer references.
- **Action**: Max undo depth (200), buffer references as IDs into separate cache with eviction.

### 23. Dual-state pattern over-applied (Simplicity)
Not all state needs lock-free communication. Session metadata is UI-only.
- **Action**: Dual-state only for audio-thread-relevant state (transport, params, graph topology). Keep rest in Zustand.

### 24. File import lacks magic-bytes validation (Security)
Extension-based validation is trivially bypassed.
- **Action**: Check first 12 bytes for WAV/MP3/OGG/FLAC signatures before decodeAudioData.

---

## Strengths (Consensus)

All three advisors agreed on these architectural strengths:

1. **AudioWorklet thread isolation** is the correct architecture for browser DSP (all three)
2. **Look-ahead scheduler pattern** is the only way to get sample-accurate timing (Scalability, Simplicity)
3. **Non-destructive editing** with clip references eliminates corruption bugs (Security, Scalability)
4. **React 19 + Zustand** is appropriately simple -- Tone.js abstraction would fight custom DSP (Simplicity)
5. **OfflineAudioContext for bounce/export** is the standard, correct approach (Scalability, Simplicity)
6. **IndexedDB persistence** without server complexity is pragmatic (Simplicity)
7. **Command-pattern undo/redo** is the right architecture for heterogeneous edit operations (Security, Simplicity)
8. **Desktop-only (1024px min)** is wise -- DAWs are desktop tools (Simplicity)
9. **Strict TypeScript + 32-bit float** reduces coercion bugs at AudioParam boundaries (Security)
10. **16-voice polyphony ceiling** matches browser capability (Simplicity)

---

## Alternative Approaches

**From Simplicity advisor (Claude Opus, HIGH confidence):**

The "simplest viable DAW" that still delivers a real product:
- Sample-based 808 with tweakable parameters (not analog-modeled synthesis)
- Native Web Audio nodes for standard effects
- Insert-only effects chain (no sends/buses/sidechain v1)
- Hardwired synth modulation paths (not full matrix)
- shadcn/ui with brutalist theme (not from-scratch design system)
- Convolution reverb only (not dual implementations)
- No arpeggiator

This still delivers: synthesizer with PolyBLEP oscillators + filters + ADSR + LFOs, 808 patterns with tweakable samples, effects, mixer with faders/inserts, piano roll, arrangement, save/load, bounce.

---

## Confidence Summary

| Advisor | Confidence | Justification |
|---------|-----------|---------------|
| Security & Reliability | MEDIUM | Right requirements named, but cross-origin isolation absent, degradation contracts underspecified, trust model implicit |
| Scalability & Performance | HIGH | Browser DAW limitations well-documented; concerns directly address physical limits of memory, GC, and rendering |
| Organizational & Delivery | N/A | Codex timed out |
| Simplicity & Alternatives | HIGH | Spec is well-researched but bundles v1 and v3 features; core architecture is sound, risk is in scope size |
