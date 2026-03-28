---
title: "Audio Quality Assurance: Testing Methodologies for Browser-Based Audio Applications"
date: 2026-03-28
summary: "Survey of testing strategies for browser audio applications including audio output verification, latency testing, glitch detection, DSP validation, state machine testing for transport systems, and cross-browser audio testing."
keywords: [audio-testing, web-audio-qa, dsp-validation, audio-glitch-detection, latency-testing]
---

# Audio Quality Assurance: Testing Methodologies for Browser-Based Audio Applications

## Abstract

Browser-based digital audio workstations (DAWs) and real-time audio applications occupy a uniquely demanding intersection of constraints: sub-millisecond timing requirements, floating-point signal processing correctness, perceptual quality metrics that resist binary pass/fail evaluation, and the non-determinism inherent in a multi-process browser runtime. Standard software testing methodology -- which assumes deterministic, synchronous, and side-effect-free units under test -- provides an inadequate foundation for audio quality assurance.

This survey presents a structured taxonomy of testing methodologies for browser-based audio applications, covering DSP algorithm validation, latency measurement, glitch and artifact detection, transport system state machine testing, integration testing for complex audio graphs, cross-browser compatibility, performance profiling, and the architectural concerns of composing these techniques into a coherent CI-capable test suite. The central insight motivating this work is that the Web Audio API's `OfflineAudioContext` makes previously intractable testing problems tractable by decoupling audio rendering from real-time constraints, enabling deterministic, fast, and reproducible audio output verification.

Practical TypeScript code examples using Vitest are provided throughout. The paper is addressed to engineers building professional audio software in the browser and to agents that need authoritative reference material for constructing comprehensive test suites.

---

## 1. Introduction

### 1.1 The Scope of the Problem

Testing audio software in the browser presents a challenge that is qualitatively different from testing most other software. The domain combines:

1. **Signal-processing correctness** -- where "correct" may mean a particular frequency response curve measured to within a tolerance of 0.1 dB
2. **Real-time behavioral correctness** -- where a note scheduled 100 ms in the future must fire within microseconds of that deadline
3. **Perceptual correctness** -- where two waveforms that differ at the sample level may be perceptually identical, or where an artifact that is negligible at low volume becomes a show-stopper at high volume
4. **State machine correctness** -- where transport operations (play, pause, stop, seek, loop) must compose correctly under all orderings
5. **Integration correctness** -- where routing a signal through a chain of filters, gains, and effects must produce an output consistent with the chain's individual transfer functions

No single testing paradigm handles all five dimensions. A comprehensive QA strategy must assemble techniques from signal processing theory, formal methods, property-based testing, performance engineering, and browser automation.

### 1.2 Why Audio Tests Are Rarely Written

Despite the complexity of the domain, audio applications are frequently shipped with little or no automated test coverage. Several factors conspire to produce this outcome:

- **The oracle problem**: it is not always clear what the "correct" output of a complex audio system is. Engineers write tests when they can articulate pass/fail criteria, and perceptual audio quality resists that articulation.
- **Real-time non-determinism**: the Web Audio API is specified with some intentional latitude. Thread scheduling, OS audio driver behavior, and garbage collection pauses all influence audio output in ways that make naive comparison tests flaky.
- **Lack of tooling precedent**: web frontend testing tooling (Vitest, Jest, Playwright) was designed for DOM manipulation and HTTP requests, not for analyzing floating-point sample buffers.
- **OfflineAudioContext underutilization**: most engineers are unaware that the Web Audio API provides a synchronous, deterministic rendering mode that eliminates real-time non-determinism from tests.

This paper provides the concepts and tooling patterns necessary to overcome each of these obstacles.

### 1.3 The Central Technique: OfflineAudioContext

The single most important concept in browser audio testing is `OfflineAudioContext`. Unlike a live `AudioContext`, which renders audio continuously to hardware at the system sample rate, an `OfflineAudioContext`:

- Renders a specified duration of audio to an in-memory `AudioBuffer` as fast as the CPU allows
- Produces deterministic output for deterministic inputs (no real-time scheduling variance)
- Requires no audio hardware, making it usable in headless CI environments
- Returns a `Promise<AudioBuffer>` that resolves when rendering is complete

Every test that needs to verify audio output should use `OfflineAudioContext` unless the test specifically targets real-time behavior (latency, scheduling drift) that cannot be measured offline.

```typescript
// The fundamental pattern for all audio output verification tests
async function renderAudio(
  durationSeconds: number,
  sampleRate: number,
  buildGraph: (ctx: OfflineAudioContext) => AudioNode
): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(
    1, // channels
    Math.ceil(durationSeconds * sampleRate),
    sampleRate
  );
  const outputNode = buildGraph(ctx);
  outputNode.connect(ctx.destination);
  const buffer = await ctx.startRendering();
  return buffer.getChannelData(0);
}
```

---

## 2. The Audio Testing Challenge

### 2.1 Temporal Correctness and Its Implications

Audio signals are inherently temporal: a 440 Hz sine wave is defined not by a single value but by a sequence of samples that, when played at 44100 samples/second, produces the correct pitch. Testing temporal correctness requires reasoning about:

- **Phase**: two sine waves at the same frequency but different phases are acoustically distinguishable
- **Duration**: an envelope that decays over 100 ms must produce the correct amplitude at each sample within that window
- **Scheduling**: a note triggered at t=1.000 s must begin at exactly sample 44100, not sample 44101

Because audio processing occurs in blocks (typically 128 samples, the Web Audio API's render quantum), sample-accurate timing is achievable but requires careful use of the `AudioContext` timeline rather than `setTimeout` or `requestAnimationFrame`.

**Testing implication**: timing tests must validate sample-level accuracy, not millisecond-level accuracy. A test that checks whether a note "started at approximately 1 second" provides far weaker guarantees than a test that verifies the first non-zero sample in the output buffer occurs at index 44100.

### 2.2 The Oracle Problem for Audio

An oracle is the mechanism by which a test determines whether the system under test produced the correct output. For audio, constructing an oracle is non-trivial for three reasons:

**Floating-point non-determinism**: floating-point arithmetic is not globally associative. Different orderings of the same arithmetic operations can produce results that differ in the last few bits. A cross-platform audio engine may legitimately produce outputs that differ at the level of 1e-7 even when implementing the same algorithm correctly.

**Perceptual vs. mathematical equivalence**: a slight phase offset between two sine waves produces waveforms that are sample-for-sample different but perceptually identical. An oracle that demands exact sample equality will produce false failures.

**Complexity of reference implementations**: for a complex audio chain (oscillator -> filter -> envelope -> reverb), the "correct" output cannot be computed analytically. The oracle must either be a golden file recorded from a trusted reference implementation, or a set of invariant properties (frequency content, RMS level, signal-to-noise ratio) that a correct implementation must satisfy.

The practical response to the oracle problem is a hierarchy of assertions with increasing specificity:

| Assertion level | Example | When to use |
|---|---|---|
| Presence | output is non-silent | Smoke tests |
| Level | RMS within [-40, -10] dBFS | Gain/mix tests |
| Spectral | peak frequency within 1 Hz of target | Oscillator tests |
| Frequency response | filter attenuation matches specification | Filter tests |
| Waveform | sample-level match within tolerance 1e-5 | DSP regression tests |
| Perceptual | PESQ/VISQOL score above threshold | Codec/enhancement tests |

### 2.3 Real-Time Constraints and Their Testing Implications

The Web Audio API processes audio in a dedicated thread (the audio worklet thread or the browser's internal audio thread). This thread has strict real-time constraints: if it fails to produce a complete render quantum before the audio hardware needs it, a buffer underrun occurs, producing an audible glitch.

Several browser behaviors complicate testing of real-time audio:

- **Garbage collection pauses**: JavaScript's GC can pause the main thread for milliseconds. While the audio thread is typically isolated from main-thread GC, AudioWorklet code running on the audio thread can trigger its own GC if it allocates memory.
- **Cross-thread communication latency**: messages between the main thread and the audio worklet thread via `MessagePort` have unpredictable latency, making parameter automation tests that rely on message-passing inherently timing-sensitive.
- **Autoplay policy**: browsers require user gesture before an `AudioContext` can start, complicating e2e test setups.

**Testing implication**: use `OfflineAudioContext` to isolate DSP logic from real-time constraints. Test scheduling accuracy using the `AudioContext` timeline (`ctx.currentTime`), not wall-clock time. Use AudioWorklet parameter automation rather than message-passing for sample-accurate control.

### 2.4 Cross-Browser Audio Engine Differences

The Web Audio specification leaves several behaviors implementation-defined, and browser vendors have made different choices:

| Behavior | Chrome/Blink | Firefox/Gecko | Safari/WebKit |
|---|---|---|---|
| BiquadFilter interpolation | Per-sample | Per-quantum | Per-sample (older: per-quantum) |
| PeriodicWave normalization | Enabled by default | Enabled by default | Subtly different default |
| AudioWorklet scheduling | Separate thread | Separate thread | Main thread (older Safari) |
| Render quantum size | 128 samples | 128 samples | 128 samples (spec-mandated) |
| OscillatorNode anti-aliasing | Varies by implementation | Varies | Varies |
| `baseLatency` reporting | Hardware-dependent | Hardware-dependent | Frequently 0 in older versions |

These differences mean that golden-file tests (comparing against a specific byte sequence) may fail on one browser despite correct behavior. Tests must incorporate browser-appropriate tolerances and, for cross-browser CI, must be run in all target browsers.

---

## 3. Audio Output Verification Strategies

### 3.1 The Render-to-Buffer Approach

The canonical approach to audio output verification is to render audio using `OfflineAudioContext` and analyze the resulting `Float32Array`. This produces a deterministic, hardware-independent sample buffer that can be inspected with standard numerical analysis.

```typescript
// vitest example: render-to-buffer test skeleton
import { describe, it, expect } from 'vitest';

describe('OscillatorNode output', () => {
  it('produces non-silent output for a 440 Hz sine wave', async () => {
    const SAMPLE_RATE = 44100;
    const DURATION = 0.1; // 100 ms

    const ctx = new OfflineAudioContext(1, SAMPLE_RATE * DURATION, SAMPLE_RATE);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    osc.connect(ctx.destination);
    osc.start(0);

    const buffer = await ctx.startRendering();
    const samples = buffer.getChannelData(0);

    // Basic oracle: output must not be all zeros
    const rms = computeRMS(samples);
    expect(rms).toBeGreaterThan(0.01);
  });
});

function computeRMS(samples: Float32Array): number {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.sqrt(sum / samples.length);
}
```

### 3.2 Sample-Level Comparison with Tolerance

For regression testing of a specific DSP algorithm, comparing the rendered output against a reference buffer is the most direct approach. Because floating-point arithmetic is not perfectly deterministic across platforms and engine versions, comparisons must use a tolerance rather than exact equality.

The appropriate tolerance depends on the algorithm:
- Simple gain multiplication: tolerance ~ 1e-7 (float32 epsilon)
- Biquad filter: tolerance ~ 1e-5 (accumulation of rounding over IIR feedback)
- Complex synthesis chain: tolerance ~ 1e-4 (or use spectral comparison instead)

```typescript
function assertBuffersClose(
  actual: Float32Array,
  expected: Float32Array,
  tolerance: number = 1e-5
): void {
  expect(actual.length).toBe(expected.length);
  let maxError = 0;
  for (let i = 0; i < actual.length; i++) {
    const err = Math.abs(actual[i] - expected[i]);
    if (err > maxError) maxError = err;
  }
  expect(maxError).toBeLessThanOrEqual(tolerance);
}

// Usage in a regression test
it('gain node scales amplitude correctly', async () => {
  const samples = await renderWithGain(0.5);
  const reference = await loadReferenceBuffer('gain-0.5-reference.raw');
  assertBuffersClose(samples, reference, 1e-6);
});
```

For storing reference buffers, use raw float32 binary files rather than audio formats (WAV, MP3) to avoid lossy encoding or endian confusion:

```typescript
// Write reference buffer (run once to establish baseline)
function saveReferenceBuffer(samples: Float32Array, path: string): void {
  const bytes = Buffer.from(samples.buffer);
  fs.writeFileSync(path, bytes);
}

// Load reference buffer
function loadReferenceBuffer(path: string): Float32Array {
  const bytes = fs.readFileSync(path);
  return new Float32Array(bytes.buffer);
}
```

### 3.3 Frequency-Domain Verification via FFT

For oscillator tests and filter tests, time-domain sample comparison is often too strict (fails due to phase differences) or too lenient (a waveform at the wrong frequency might have similar RMS). Frequency-domain analysis provides a more appropriate oracle.

The Discrete Fourier Transform maps a time-domain buffer to a frequency-domain spectrum. Given a buffer rendered at sample rate `fs` with `N` samples, the FFT bin at index `k` corresponds to frequency `k * fs / N`.

```typescript
// Minimal real-valued FFT using Web API (available in Node via web-api-compatible libs)
// In practice, use a library like fft.js or ml-fft

function computeFFTMagnitude(samples: Float32Array): Float32Array {
  const N = samples.length;
  // Zero-pad to next power of 2 for efficiency
  const fftSize = nextPowerOfTwo(N);
  const magnitudes = new Float32Array(fftSize / 2);

  // Cooley-Tukey FFT implementation or library call
  const spectrum = fft(samples, fftSize);

  for (let k = 0; k < fftSize / 2; k++) {
    const re = spectrum.real[k];
    const im = spectrum.imag[k];
    magnitudes[k] = Math.sqrt(re * re + im * im) / (fftSize / 2);
  }
  return magnitudes;
}

function findPeakFrequency(magnitudes: Float32Array, sampleRate: number): number {
  let peakBin = 0;
  let peakMag = 0;
  for (let k = 0; k < magnitudes.length; k++) {
    if (magnitudes[k] > peakMag) {
      peakMag = magnitudes[k];
      peakBin = k;
    }
  }
  return (peakBin * sampleRate) / (magnitudes.length * 2);
}

// Parabolic interpolation for sub-bin frequency accuracy
function refinePeakFrequency(
  magnitudes: Float32Array,
  sampleRate: number
): number {
  let peakBin = 0;
  let peakMag = 0;
  for (let k = 1; k < magnitudes.length - 1; k++) {
    if (magnitudes[k] > peakMag) {
      peakMag = magnitudes[k];
      peakBin = k;
    }
  }
  // Parabolic interpolation: refine bin index
  const alpha = magnitudes[peakBin - 1];
  const beta = magnitudes[peakBin];
  const gamma = magnitudes[peakBin + 1];
  const refinement = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
  const refinedBin = peakBin + refinement;
  return (refinedBin * sampleRate) / (magnitudes.length * 2);
}

// Test: oscillator produces correct frequency
it('OscillatorNode produces 440 Hz output', async () => {
  const SAMPLE_RATE = 44100;
  const DURATION = 0.5; // 500 ms for good frequency resolution

  const ctx = new OfflineAudioContext(1, SAMPLE_RATE * DURATION, SAMPLE_RATE);
  const osc = ctx.createOscillator();
  osc.frequency.value = 440;
  osc.connect(ctx.destination);
  osc.start(0);

  const buffer = await ctx.startRendering();
  const samples = buffer.getChannelData(0);
  const magnitudes = computeFFTMagnitude(samples);
  const peakFreq = refinePeakFrequency(magnitudes, SAMPLE_RATE);

  // Allow 1 Hz tolerance (FFT bin resolution at 500 ms = 2 Hz, interpolation < 1 Hz)
  expect(Math.abs(peakFreq - 440)).toBeLessThan(1.0);
});
```

The frequency resolution of an FFT is `fs / N`. With `fs = 44100` and 500 ms of audio (`N = 22050`), resolution is 2 Hz per bin, with parabolic interpolation achieving sub-Hz accuracy for pure tones.

### 3.4 Spectral Analysis for Filter Verification

A filter's behavior is fully described by its frequency response: for each input frequency, what is the output amplitude (magnitude response) and phase shift (phase response)? Testing a filter means measuring its actual frequency response and comparing it against the theoretical specification.

The standard measurement technique is the frequency sweep: render a chirp signal (sine wave sweeping from 20 Hz to 20 kHz) through the filter, then compare the output power at each frequency against input power.

```typescript
// Generate a logarithmic sine sweep (chirp)
function generateLogSweep(
  startFreq: number,
  endFreq: number,
  durationSeconds: number,
  sampleRate: number
): Float32Array {
  const N = Math.ceil(durationSeconds * sampleRate);
  const samples = new Float32Array(N);
  const k = Math.log(endFreq / startFreq) / durationSeconds;

  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    const phase = 2 * Math.PI * startFreq * (Math.exp(k * t) - 1) / k;
    samples[i] = Math.sin(phase);
  }
  return samples;
}

// Measure filter frequency response using AudioBuffer source
async function measureFilterResponse(
  filterParams: BiquadFilterOptions,
  frequencies: Float32Array,
  sampleRate: number = 44100
): Promise<{ magnitude: Float32Array; phase: Float32Array }> {
  const magnitude = new Float32Array(frequencies.length);
  const phase = new Float32Array(frequencies.length);

  // Use BiquadFilterNode.getFrequencyResponse() -- faster than sweep for biquad
  const ctx = new OfflineAudioContext(1, 1, sampleRate);
  const filter = ctx.createBiquadFilter();
  Object.assign(filter, filterParams);
  filter.getFrequencyResponse(frequencies, magnitude, phase);

  return { magnitude, phase };
}

// Test: low-pass filter at 1000 Hz attenuates 10 kHz by at least 20 dB
it('lowpass filter attenuates above cutoff', async () => {
  const testFreqs = new Float32Array([500, 1000, 2000, 5000, 10000]);
  const ctx = new OfflineAudioContext(1, 1, 44100);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;
  filter.Q.value = 0.707; // Butterworth Q

  const mag = new Float32Array(testFreqs.length);
  const phase = new Float32Array(testFreqs.length);
  filter.getFrequencyResponse(testFreqs, mag, phase);

  // Passband: 500 Hz should have gain close to 1.0 (0 dB)
  const db500 = 20 * Math.log10(mag[0]);
  expect(db500).toBeGreaterThan(-3); // within 3 dB passband ripple

  // Stopband: 10 kHz should be attenuated by at least 20 dB
  const db10k = 20 * Math.log10(mag[4]);
  expect(db10k).toBeLessThan(-20);
});
```

For custom DSP filters (implemented in AudioWorklet or JavaScript), the sweep-and-FFT approach is required:

```typescript
async function measureCustomFilterResponse(
  applyFilter: (ctx: OfflineAudioContext, source: AudioBufferSourceNode) => AudioNode,
  sampleRate: number = 44100,
  sweepDuration: number = 2
): Promise<Float32Array> {
  const sweepSamples = generateLogSweep(20, 20000, sweepDuration, sampleRate);
  const N = sweepSamples.length;

  const ctx = new OfflineAudioContext(1, N, sampleRate);
  const sweepBuffer = ctx.createBuffer(1, N, sampleRate);
  sweepBuffer.copyToChannel(sweepSamples, 0);

  const source = ctx.createBufferSource();
  source.buffer = sweepBuffer;

  const output = applyFilter(ctx, source);
  output.connect(ctx.destination);
  source.start(0);

  const rendered = await ctx.startRendering();
  const outputSamples = rendered.getChannelData(0);

  // Compute magnitude response by comparing output FFT to input FFT
  return computeMagnitudeResponse(sweepSamples, outputSamples);
}
```

### 3.5 RMS and Peak Level Checking

For gain stages, mixers, and compressors, the primary verification metric is signal level. RMS (root mean square) represents perceived loudness; peak level represents the maximum instantaneous amplitude.

```typescript
function computeRMSdBFS(samples: Float32Array): number {
  let sum = 0;
  for (const s of samples) sum += s * s;
  const rms = Math.sqrt(sum / samples.length);
  return 20 * Math.log10(rms);
}

function computePeakdBFS(samples: Float32Array): number {
  let peak = 0;
  for (const s of samples) {
    const abs = Math.abs(s);
    if (abs > peak) peak = abs;
  }
  return 20 * Math.log10(peak);
}

// Test: gain node at -6 dB reduces RMS by approximately 6 dB
it('GainNode at -6 dB reduces level by 6 dB', async () => {
  const SAMPLE_RATE = 44100;
  const DURATION = 0.5;
  const N = SAMPLE_RATE * DURATION;

  // Reference: unity gain
  const refCtx = new OfflineAudioContext(1, N, SAMPLE_RATE);
  const refOsc = refCtx.createOscillator();
  refOsc.frequency.value = 1000;
  refOsc.connect(refCtx.destination);
  refOsc.start(0);
  const refBuffer = await refCtx.startRendering();
  const refRMS = computeRMSdBFS(refBuffer.getChannelData(0));

  // Test: -6 dB gain
  const ctx = new OfflineAudioContext(1, N, SAMPLE_RATE);
  const osc = ctx.createOscillator();
  osc.frequency.value = 1000;
  const gain = ctx.createGain();
  gain.gain.value = 0.5011872; // -6 dB = 10^(-6/20)
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  const buffer = await ctx.startRendering();
  const testRMS = computeRMSdBFS(buffer.getChannelData(0));

  expect(Math.abs((testRMS - refRMS) - (-6))).toBeLessThan(0.1); // within 0.1 dB
});
```

### 3.6 Using AnalyserNode for Real-Time Monitoring in Tests

For integration tests that require monitoring audio while it plays (rather than post-rendering), `AnalyserNode` provides FFT and time-domain analysis at each render quantum. In tests that must use a live `AudioContext` (e.g., latency measurement), AnalyserNode provides the observability hook.

```typescript
// Pattern: attach AnalyserNode to capture real-time audio data
function createMonitoredContext(sampleRate = 44100): {
  ctx: AudioContext;
  analyser: AnalyserNode;
  getSpectrum: () => Float32Array;
} {
  const ctx = new AudioContext({ sampleRate });
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.connect(ctx.destination);

  return {
    ctx,
    analyser,
    getSpectrum: () => {
      const data = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(data);
      return data;
    },
  };
}
```

---

## 4. DSP Algorithm Validation

### 4.1 Unit Testing Oscillators

An oscillator test must verify:
1. The correct frequency is produced (FFT peak at target frequency)
2. The correct waveform type (sine has single peak; sawtooth has harmonic series decaying as 1/n; square has only odd harmonics)
3. Frequency modulation tracks correctly when `frequency.value` is automated

```typescript
describe('OscillatorNode waveform validation', () => {
  const SAMPLE_RATE = 44100;
  const DURATION = 0.5;
  const N = SAMPLE_RATE * DURATION;

  async function renderOscillator(
    type: OscillatorType,
    frequency: number
  ): Promise<Float32Array> {
    const ctx = new OfflineAudioContext(1, N, SAMPLE_RATE);
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(ctx.destination);
    osc.start(0);
    const buffer = await ctx.startRendering();
    return buffer.getChannelData(0);
  }

  it('sine wave has a single spectral peak at the fundamental', async () => {
    const samples = await renderOscillator('sine', 440);
    const mags = computeFFTMagnitude(samples);
    const fundamentalBin = Math.round((440 * N) / SAMPLE_RATE);

    // Energy at fundamental must dominate
    const fundamentalEnergy = mags[fundamentalBin];
    const totalEnergy = mags.reduce((a, b) => a + b, 0);
    const fundamentalRatio = fundamentalEnergy / totalEnergy;
    expect(fundamentalRatio).toBeGreaterThan(0.95); // >95% of energy at 440 Hz
  });

  it('sawtooth wave contains harmonic series', async () => {
    const samples = await renderOscillator('sawtooth', 220);
    const mags = computeFFTMagnitude(samples);

    // Verify 1st through 5th harmonics are present
    for (let harmonic = 1; harmonic <= 5; harmonic++) {
      const freq = 220 * harmonic;
      const bin = Math.round((freq * N) / SAMPLE_RATE);
      if (bin < mags.length) {
        // Each harmonic should have measurable energy
        expect(mags[bin]).toBeGreaterThan(0.001);
      }
    }
  });

  it('square wave contains only odd harmonics', async () => {
    const samples = await renderOscillator('square', 220);
    const mags = computeFFTMagnitude(samples);

    // Even harmonics should be significantly weaker than odd harmonics
    const bin2nd = Math.round((440 * N) / SAMPLE_RATE);
    const bin3rd = Math.round((660 * N) / SAMPLE_RATE);
    expect(mags[bin2nd]).toBeLessThan(mags[bin3rd] * 0.05);
  });
});
```

### 4.2 Unit Testing Filters: Frequency Response Measurement

A complete filter test suite verifies the filter's behavior across three regions: passband (gain close to 1.0), transition band (roll-off follows the specified slope), and stopband (attenuation meets specification).

```typescript
describe('BiquadFilterNode frequency response', () => {
  function createFilterResponse(
    type: BiquadFilterType,
    frequency: number,
    q: number,
    testFrequencies: number[]
  ): Float32Array {
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;

    const freqArray = new Float32Array(testFrequencies);
    const mag = new Float32Array(testFrequencies.length);
    const phase = new Float32Array(testFrequencies.length);
    filter.getFrequencyResponse(freqArray, mag, phase);
    return mag;
  }

  it('highpass at 1000 Hz passes 10 kHz and attenuates 100 Hz', () => {
    const mag = createFilterResponse('highpass', 1000, 0.707, [100, 1000, 10000]);
    expect(20 * Math.log10(mag[2])).toBeGreaterThan(-3);  // 10 kHz: passband
    expect(20 * Math.log10(mag[0])).toBeLessThan(-20);    // 100 Hz: stopband
  });

  it('peaking EQ at 1 kHz, +6 dB boosts only the target frequency', () => {
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = 1000;
    filter.Q.value = 1.0;
    filter.gain.value = 6; // +6 dB

    const testFreqs = new Float32Array([500, 1000, 2000]);
    const mag = new Float32Array(3);
    const phase = new Float32Array(3);
    filter.getFrequencyResponse(testFreqs, mag, phase);

    const db1k = 20 * Math.log10(mag[1]);
    const db500 = 20 * Math.log10(mag[0]);
    expect(Math.abs(db1k - 6)).toBeLessThan(0.5); // Peak should be ~+6 dB
    expect(Math.abs(db500)).toBeLessThan(3);       // 500 Hz should be near 0 dB
  });
});
```

### 4.3 Unit Testing Envelopes: Amplitude Curve Verification

ADSR (Attack, Decay, Sustain, Release) envelopes must be tested for:
- Attack reaches peak at the correct time
- Decay reaches sustain level at the correct time
- Sustain maintains level during hold
- Release decays to silence at the correct time

```typescript
describe('ADSR envelope', () => {
  // Assumes a custom envelope implementation that modulates a GainNode
  async function renderEnvelope(params: {
    attack: number; decay: number; sustain: number; release: number;
    holdDuration: number; sampleRate?: number;
  }): Promise<Float32Array> {
    const sr = params.sampleRate ?? 44100;
    const totalDuration =
      params.attack + params.decay + params.holdDuration + params.release + 0.01;
    const N = Math.ceil(totalDuration * sr);

    const ctx = new OfflineAudioContext(1, N, sr);

    // Constant input signal at unity gain
    const osc = ctx.createOscillator();
    osc.frequency.value = 440;

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0, 0);

    // Attack
    envGain.gain.linearRampToValueAtTime(1.0, params.attack);
    // Decay to sustain
    envGain.gain.linearRampToValueAtTime(
      params.sustain,
      params.attack + params.decay
    );
    // Hold (sustain constant)
    envGain.gain.setValueAtTime(
      params.sustain,
      params.attack + params.decay + params.holdDuration
    );
    // Release
    envGain.gain.linearRampToValueAtTime(
      0,
      params.attack + params.decay + params.holdDuration + params.release
    );

    osc.connect(envGain);
    envGain.connect(ctx.destination);
    osc.start(0);

    const buffer = await ctx.startRendering();
    return buffer.getChannelData(0);
  }

  it('attack reaches peak amplitude at the correct sample', async () => {
    const SR = 44100;
    const samples = await renderEnvelope({
      attack: 0.1, decay: 0.05, sustain: 0.7, release: 0.1,
      holdDuration: 0.2, sampleRate: SR,
    });

    // Peak should occur around sample index = 0.1 * 44100 = 4410
    const attackEndSample = Math.round(0.1 * SR);

    // Find the RMS in a 10 ms window around the attack end
    const windowSize = Math.round(0.01 * SR);
    const windowStart = attackEndSample - windowSize / 2;
    const window = samples.slice(windowStart, windowStart + windowSize);
    const rmsAtPeak = computeRMS(window);

    // At peak, gain = 1.0, osc is sine at 440 Hz: RMS = 0.5/sqrt(2) ~ 0.354
    // Allow 10% tolerance
    expect(rmsAtPeak).toBeGreaterThan(0.3);
  });

  it('sustain level is maintained during hold phase', async () => {
    const SR = 44100;
    const SUSTAIN = 0.6;
    const samples = await renderEnvelope({
      attack: 0.05, decay: 0.05, sustain: SUSTAIN, release: 0.05,
      holdDuration: 0.3, sampleRate: SR,
    });

    // Mid-hold: t = 0.05 + 0.05 + 0.15 = 0.25 s
    const holdMidSample = Math.round(0.25 * SR);
    const windowSize = Math.round(0.02 * SR);
    const window = samples.slice(holdMidSample, holdMidSample + windowSize);
    const rmsAtHold = computeRMS(window);

    // Expected RMS at sustain gain SUSTAIN = 0.6: RMS of sine = SUSTAIN / sqrt(2)
    const expectedRMS = SUSTAIN / Math.sqrt(2);
    expect(Math.abs(rmsAtHold - expectedRMS)).toBeLessThan(0.05);
  });
});
```

### 4.4 Testing 808 Drum Synthesis: Reference Waveform Comparison

The Roland TR-808 bass drum synthesis is a canonical test case for complex DSP: a pitch-swept sine wave through a resonant bandpass filter, with a click transient at the attack. The reference waveform test validates the synthesis against a known-good sample.

```typescript
describe('808 bass drum synthesis', () => {
  // 808 = pitch-swept sine + click, modeled via Web Audio
  async function render808(params: {
    pitch: number;       // fundamental frequency (Hz)
    decay: number;       // body decay time (s)
    clickLevel: number;  // click transient amplitude
    pitchDecay: number;  // pitch sweep decay time (s)
    sampleRate?: number;
  }): Promise<Float32Array> {
    const sr = params.sampleRate ?? 44100;
    const duration = params.decay + 0.1;
    const N = Math.ceil(duration * sr);

    const ctx = new OfflineAudioContext(1, N, sr);

    // Body: pitch-swept sine
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(params.pitch * 2, 0);
    bodyOsc.frequency.exponentialRampToValueAtTime(
      params.pitch,
      params.pitchDecay
    );

    const bodyEnv = ctx.createGain();
    bodyEnv.gain.setValueAtTime(1.0, 0);
    bodyEnv.gain.exponentialRampToValueAtTime(0.001, params.decay);

    // Click: short noise burst at transient
    const clickBuffer = ctx.createBuffer(1, Math.round(0.003 * sr), sr);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      clickData[i] = (Math.random() * 2 - 1) * params.clickLevel
        * (1 - i / clickData.length);
    }
    const clickSource = ctx.createBufferSource();
    clickSource.buffer = clickBuffer;

    bodyOsc.connect(bodyEnv);
    bodyEnv.connect(ctx.destination);
    clickSource.connect(ctx.destination);

    bodyOsc.start(0);
    clickSource.start(0);

    const buffer = await ctx.startRendering();
    return buffer.getChannelData(0);
  }

  it('produces a transient peak followed by decaying low-frequency content', async () => {
    const samples = await render808({
      pitch: 55, decay: 0.8, clickLevel: 0.3, pitchDecay: 0.05,
    });

    // Attack should have highest peak in first 10 ms
    const attackSamples = samples.slice(0, 441);
    const bodyStart = samples.slice(441, 4410);
    const attackPeak = Math.max(...attackSamples.map(Math.abs));
    const bodyPeak = Math.max(...bodyStart.map(Math.abs));

    expect(attackPeak).toBeGreaterThan(bodyPeak * 0.8);

    // Verify low-frequency content (55 Hz range) in body
    const bodySamples = samples.slice(0, 22050); // 500 ms
    const mags = computeFFTMagnitude(bodySamples);
    const peakFreq = refinePeakFrequency(mags, 44100);
    expect(peakFreq).toBeLessThan(150); // Body should peak below 150 Hz
  });
});
```

### 4.5 Property-Based Testing for DSP: Metamorphic Relations

Property-based testing (PBT) validates invariants that hold for all inputs rather than specific examples. For DSP, the most important invariants are the linearity properties of linear time-invariant (LTI) systems.

An LTI system satisfies two properties:

**Linearity**: `H(a*x + b*y) = a*H(x) + b*H(y)`

This implies:
- Superposition: `H(x + y) = H(x) + H(y)`
- Scaling: `H(k*x) = k*H(x)`

**Time-invariance**: `H(delay(x, d)) = delay(H(x), d)`

```typescript
import { fc } from '@fast-check/vitest';

// Property-based test: LTI system linearity (superposition)
describe('Filter superposition property', () => {
  it('H(x + y) == H(x) + H(y) for lowpass filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Random sine amplitudes between 0.01 and 0.5
        fc.float({ min: 0.01, max: 0.5 }),
        fc.float({ min: 0.01, max: 0.5 }),
        async (ampA, ampB) => {
          const SR = 44100;
          const N = 4410; // 100 ms

          async function renderFiltered(
            ampX: number, ampY: number, combined: boolean
          ): Promise<Float32Array> {
            const ctx = new OfflineAudioContext(1, N, SR);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            if (combined) {
              // H(x + y): filter the sum
              const oscX = ctx.createOscillator();
              oscX.frequency.value = 440;
              const gainX = ctx.createGain();
              gainX.gain.value = ampX;

              const oscY = ctx.createOscillator();
              oscY.frequency.value = 880;
              const gainY = ctx.createGain();
              gainY.gain.value = ampY;

              oscX.connect(gainX);
              oscY.connect(gainY);
              gainX.connect(filter);
              gainY.connect(filter);
              filter.connect(ctx.destination);
              oscX.start(0);
              oscY.start(0);
            }
            // Note: separate rendering is handled outside this function
            const buf = await ctx.startRendering();
            return buf.getChannelData(0);
          }

          // H(x + y)
          const combined = await renderFiltered(ampA, ampB, true);

          // H(x) + H(y): render separately and sum
          const hx = await renderSingleFiltered(440, ampA, N, SR);
          const hy = await renderSingleFiltered(880, ampB, N, SR);
          const sumHxHy = new Float32Array(N);
          for (let i = 0; i < N; i++) sumHxHy[i] = hx[i] + hy[i];

          // Check max absolute difference
          let maxErr = 0;
          for (let i = 0; i < N; i++) {
            maxErr = Math.max(maxErr, Math.abs(combined[i] - sumHxHy[i]));
          }
          return maxErr < 1e-4; // LTI tolerance
        }
      )
    );
  });
});

// Gain scaling metamorphic property: H(k*x) == k*H(x)
it('GainNode satisfies scaling property', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.float({ min: 0.0, max: 2.0 }),
      async (k) => {
        const SR = 44100;
        const N = 4410;

        // Render x through gain k
        const scaled = await renderWithGainK(k, N, SR);

        // Render unity, then multiply by k
        const unity = await renderWithGainK(1.0, N, SR);
        const manuallyScaled = unity.map((s) => s * k);

        let maxErr = 0;
        for (let i = 0; i < N; i++) {
          maxErr = Math.max(maxErr, Math.abs(scaled[i] - manuallyScaled[i]));
        }
        return maxErr < 1e-6;
      }
    )
  );
});
```

### 4.6 Snapshot and Golden-File Testing for Complex Audio Chains

For complex synthesis chains where analytical computation of the expected output is infeasible, the golden-file approach stores a reference output from a known-good implementation and validates future outputs against it. The process is:

1. Implement the chain; run the test once with `--update-snapshots` to capture the baseline
2. All future test runs compare rendered output against the stored baseline
3. When intentional changes are made, regenerate the baseline explicitly

```typescript
// Snapshot testing for a complex synth chain
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SNAPSHOT_DIR = join(__dirname, '__audio_snapshots__');

async function matchesAudioSnapshot(
  samples: Float32Array,
  name: string,
  tolerance: number = 1e-4
): Promise<boolean> {
  const snapshotPath = join(SNAPSHOT_DIR, `${name}.f32`);

  if (process.env.UPDATE_AUDIO_SNAPSHOTS === '1' || !existsSync(snapshotPath)) {
    // Write new snapshot
    writeFileSync(snapshotPath, Buffer.from(samples.buffer));
    return true;
  }

  // Load and compare
  const snapshotBytes = readFileSync(snapshotPath);
  const snapshot = new Float32Array(snapshotBytes.buffer);

  if (snapshot.length !== samples.length) return false;

  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i] - snapshot[i]) > tolerance) return false;
  }
  return true;
}

it('808 synthesis matches golden file', async () => {
  const samples = await render808({ pitch: 55, decay: 0.8, clickLevel: 0.3, pitchDecay: 0.05 });
  const matches = await matchesAudioSnapshot(samples, '808-standard-params');
  expect(matches).toBe(true);
});
```

---

## 5. Latency Testing

### 5.1 Measuring End-to-End Audio Latency Programmatically

Audio latency in browser applications has several components:

- **Script processing latency**: time from application code scheduling an event to the Web Audio API scheduling it
- **Buffering latency** (`AudioContext.baseLatency`): time added by the browser's output buffer
- **Hardware latency** (`AudioContext.outputLatency`): time the OS/hardware needs to deliver audio to the speaker
- **MIDI input latency** (if applicable): time from MIDI event to scheduling

For applications that require low-latency response (live instruments, DJ software), the total round-trip latency must remain below 10-20 ms.

```typescript
// Programmatic latency interrogation
function measureReportedLatency(): {
  baseLatency: number;
  outputLatency: number;
  total: number;
} {
  const ctx = new AudioContext();
  const base = ctx.baseLatency;
  const output = ctx.outputLatency;
  ctx.close();

  return {
    baseLatency: base,
    outputLatency: output,
    total: base + output,
  };
}

// Test: reported latency is within acceptable bounds for musical use
it('AudioContext reports acceptable latency', () => {
  const latency = measureReportedLatency();

  // baseLatency < 20 ms is acceptable for musical applications
  expect(latency.baseLatency).toBeLessThan(0.020);

  // total < 50 ms is the outer bound for usable latency
  expect(latency.total).toBeLessThan(0.050);
});
```

### 5.2 Round-Trip Latency Measurement (Loopback Test)

`AudioContext.outputLatency` is a browser estimate that may not accurately reflect actual hardware latency. For precise measurement, a loopback test is required: play a click through the audio output, record it with the audio input, and measure the time difference.

In a headless browser test environment, a software loopback can be simulated using a ScriptProcessorNode or AudioWorklet that captures rendered output samples and compares timestamps.

```typescript
// Software loopback latency measurement
// Uses AudioWorkletProcessor to capture timing data
const workletCode = `
class LatencyMeasureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.triggered = false;
    this.triggerFrame = -1;
    this.detectedFrame = -1;
  }

  process(inputs, outputs) {
    const currentFrame = currentTime * sampleRate;

    // Trigger: insert a click at a known frame
    if (!this.triggered && currentFrame > sampleRate * 0.1) {
      outputs[0][0][0] = 1.0; // click
      this.triggerFrame = currentFrame;
      this.triggered = true;
    }

    // Detect: listen for the click to come back
    const input = inputs[0][0];
    if (this.triggered && this.detectedFrame < 0 && input) {
      for (let i = 0; i < input.length; i++) {
        if (Math.abs(input[i]) > 0.5) {
          this.detectedFrame = currentFrame + i;
          this.port.postMessage({
            trigger: this.triggerFrame,
            detected: this.detectedFrame,
            latencyFrames: this.detectedFrame - this.triggerFrame,
          });
          return false; // stop processing
        }
      }
    }
    return true;
  }
}
registerProcessor('latency-measure', LatencyMeasureProcessor);
`;

async function measureRoundTripLatency(): Promise<number> {
  return new Promise((resolve) => {
    const ctx = new AudioContext();
    // ... (setup worklet, connect output to input via loopback device)
    // Returns latency in seconds
  });
}
```

### 5.3 Scheduling Accuracy Testing

Web Audio API events scheduled via `AudioParam.setValueAtTime()` and related methods are supposed to execute at sample-level precision. Verifying this requires rendering and inspecting the output buffer.

```typescript
// Test: AudioParam event fires at the scheduled sample
it('setValueAtTime fires at the correct sample', async () => {
  const SR = 44100;
  const SCHEDULE_TIME = 0.1; // 100 ms = sample 4410
  const SCHEDULED_SAMPLE = Math.round(SCHEDULE_TIME * SR);
  const N = SR * 0.2; // 200 ms

  const ctx = new OfflineAudioContext(1, N, SR);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, 0);
  gain.gain.setValueAtTime(1, SCHEDULE_TIME); // step up at 100 ms

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);

  const buffer = await ctx.startRendering();
  const samples = buffer.getChannelData(0);

  // Before scheduled time: silence
  const preSilence = samples.slice(0, SCHEDULED_SAMPLE - 10);
  expect(computeRMS(preSilence)).toBeLessThan(0.001);

  // After scheduled time: signal present
  const postSignal = samples.slice(SCHEDULED_SAMPLE + 10);
  expect(computeRMS(postSignal)).toBeGreaterThan(0.1);

  // First non-zero sample should be at SCHEDULED_SAMPLE (within render quantum boundary)
  let firstNonZero = -1;
  for (let i = SCHEDULED_SAMPLE - 128; i < SCHEDULED_SAMPLE + 128; i++) {
    if (Math.abs(samples[i]) > 0.001) {
      firstNonZero = i;
      break;
    }
  }
  // Allow 1 render quantum (128 samples) of scheduling granularity
  expect(Math.abs(firstNonZero - SCHEDULED_SAMPLE)).toBeLessThan(128);
});
```

---

## 6. Glitch and Artifact Detection

### 6.1 Buffer Underrun Detection

A buffer underrun occurs when the audio thread fails to produce the next render quantum in time. The output is typically silence (zeros) for one or more quanta -- a "click" or "pop" artifact.

Detection approach: scan the rendered buffer for anomalously short runs of zero samples bracketed by non-zero samples (as opposed to intentional silence at the start or end).

```typescript
interface GlitchReport {
  position: number;    // sample index
  duration: number;    // length in samples
  type: 'zero-run' | 'discontinuity' | 'clip';
}

function detectZeroRunGlitches(
  samples: Float32Array,
  minSignalRMS: number = 0.01,  // minimum RMS to consider signal "active"
  minGlitchLength: number = 5,  // minimum zero-run length to flag
  maxGlitchLength: number = 1000 // zero-runs longer than this may be intentional silence
): GlitchReport[] {
  const glitches: GlitchReport[] = [];
  let zeroRunStart = -1;
  let inZeroRun = false;

  for (let i = 0; i < samples.length; i++) {
    const isZero = Math.abs(samples[i]) < 1e-7;

    if (isZero && !inZeroRun) {
      zeroRunStart = i;
      inZeroRun = true;
    } else if (!isZero && inZeroRun) {
      const runLength = i - zeroRunStart;
      if (runLength >= minGlitchLength && runLength <= maxGlitchLength) {
        // Check that there's signal both before and after the zero run
        const preSignal = zeroRunStart > 100
          ? computeRMS(samples.slice(zeroRunStart - 100, zeroRunStart))
          : 0;
        const postSignal = computeRMS(samples.slice(i, Math.min(i + 100, samples.length)));

        if (preSignal > minSignalRMS && postSignal > minSignalRMS) {
          glitches.push({ position: zeroRunStart, duration: runLength, type: 'zero-run' });
        }
      }
      inZeroRun = false;
    }
  }
  return glitches;
}
```

### 6.2 Click and Pop Detection: Waveform Discontinuity

Clicks and pops are caused by sudden discontinuities in the waveform -- typically when audio is started or stopped without a crossfade, or when a parameter changes instantaneously to a distant value. Detection relies on measuring the first derivative of the waveform and flagging large jumps.

```typescript
function detectDiscontinuities(
  samples: Float32Array,
  threshold: number = 0.1 // maximum allowed sample-to-sample jump
): GlitchReport[] {
  const glitches: GlitchReport[] = [];

  for (let i = 1; i < samples.length; i++) {
    const jump = Math.abs(samples[i] - samples[i - 1]);
    if (jump > threshold) {
      glitches.push({
        position: i,
        duration: 1,
        type: 'discontinuity',
      });
      // Skip ahead to avoid flagging the same event multiple times
      i += 64;
    }
  }
  return glitches;
}

// Test: audio stop should not produce click
it('stopping oscillator does not produce discontinuity', async () => {
  const SR = 44100;
  const STOP_TIME = 0.1;
  const N = SR * 0.15;

  const ctx = new OfflineAudioContext(1, N, SR);
  const osc = ctx.createOscillator();
  osc.frequency.value = 440;
  osc.connect(ctx.destination);
  osc.start(0);
  osc.stop(STOP_TIME); // Hard stop -- expected to produce click

  const buffer = await ctx.startRendering();
  const samples = buffer.getChannelData(0);
  const glitches = detectDiscontinuities(samples, 0.1);

  // This test DOCUMENTS that hard stop produces a click
  // A proper implementation would use exponentialRampToValueAtTime to fade out
  // expect(glitches.length).toBe(0); // Will fail for hard stop
  // Instead, verify a fade-out implementation is click-free:
  const ctxFade = new OfflineAudioContext(1, N, SR);
  const oscFade = ctxFade.createOscillator();
  const fadeGain = ctxFade.createGain();
  oscFade.frequency.value = 440;
  fadeGain.gain.setValueAtTime(1.0, STOP_TIME - 0.005);
  fadeGain.gain.linearRampToValueAtTime(0, STOP_TIME);
  oscFade.connect(fadeGain);
  fadeGain.connect(ctxFade.destination);
  oscFade.start(0);
  oscFade.stop(STOP_TIME);

  const fadeBuffer = await ctxFade.startRendering();
  const fadeSamples = fadeBuffer.getChannelData(0);
  const fadeGlitches = detectDiscontinuities(fadeSamples, 0.1);
  expect(fadeGlitches.length).toBe(0);
});
```

### 6.3 Silence Detection: Unintended Gaps

A gap detection test verifies that no unintended silence appears in a region where signal is expected. This is distinct from the zero-run glitch detector: here we are checking that the overall RMS in a window exceeds a minimum threshold.

```typescript
function detectUnintendedSilence(
  samples: Float32Array,
  windowSizeMs: number = 10,
  sampleRate: number = 44100,
  silenceThresholdDB: number = -60
): GlitchReport[] {
  const windowSizeSamples = Math.round((windowSizeMs / 1000) * sampleRate);
  const silenceThresholdLinear = Math.pow(10, silenceThresholdDB / 20);
  const glitches: GlitchReport[] = [];

  for (let i = 0; i < samples.length - windowSizeSamples; i += windowSizeSamples) {
    const window = samples.slice(i, i + windowSizeSamples);
    const rms = computeRMS(window);
    if (rms < silenceThresholdLinear) {
      glitches.push({
        position: i,
        duration: windowSizeSamples,
        type: 'zero-run',
      });
    }
  }
  return glitches;
}
```

### 6.4 Clipping Detection

Clipping occurs when the signal exceeds the [-1.0, 1.0] range. In floating-point Web Audio, clipping does not produce hard saturation (the signal retains values > 1.0 internally) but will distort when converted to integer audio output.

```typescript
function detectClipping(
  samples: Float32Array,
  clipThreshold: number = 1.0
): { count: number; positions: number[] } {
  const positions: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) >= clipThreshold) {
      positions.push(i);
    }
  }
  return { count: positions.length, positions };
}

it('mixer output does not clip when multiple channels are summed', async () => {
  const SR = 44100;
  const N = SR * 0.2;
  const ctx = new OfflineAudioContext(1, N, SR);

  // 4 oscillators summed without individual gain reduction
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    osc.frequency.value = 220 * (i + 1);
    const gain = ctx.createGain();
    gain.gain.value = 0.25; // Each at -12 dB to prevent sum from clipping
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
  }

  const buffer = await ctx.startRendering();
  const samples = buffer.getChannelData(0);
  const { count } = detectClipping(samples);

  expect(count).toBe(0);
});
```

### 6.5 Stress Testing Under CPU Load

CPU stress tests evaluate whether the audio rendering pipeline maintains stability under high computational load. In a live `AudioContext`, CPU pressure can cause scheduling glitches. In tests, the approach is to construct maximally expensive audio graphs and measure whether they complete rendering within time budget.

```typescript
// Stress test: render a large number of voices simultaneously
it('renders 64-voice polyphony without errors', async () => {
  const SR = 44100;
  const VOICE_COUNT = 64;
  const DURATION = 2;
  const N = SR * DURATION;

  const ctx = new OfflineAudioContext(2, N, SR);
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1 / VOICE_COUNT;
  masterGain.connect(ctx.destination);

  for (let i = 0; i < VOICE_COUNT; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 55 + i * 3.7; // slightly detuned for density

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000 + i * 100;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, 0);
    env.gain.linearRampToValueAtTime(1, 0.01 + i * 0.001);
    env.gain.linearRampToValueAtTime(0, DURATION - 0.05);

    osc.connect(filter);
    filter.connect(env);
    env.connect(masterGain);
    osc.start(0);
  }

  // OfflineAudioContext renders as fast as possible; measure render time
  const startTime = performance.now();
  const buffer = await ctx.startRendering();
  const renderTime = performance.now() - startTime;

  // Verify output is valid (not silence, no NaN)
  const samples = buffer.getChannelData(0);
  let hasNaN = false;
  for (const s of samples) {
    if (isNaN(s)) { hasNaN = true; break; }
  }
  expect(hasNaN).toBe(false);
  expect(computeRMS(samples)).toBeGreaterThan(0.001);

  // Log render time for performance regression tracking
  console.info(`64-voice render time: ${renderTime.toFixed(0)} ms for ${DURATION}s audio`);
}, 30000); // 30s timeout for stress test
```

---

## 7. Transport System Testing

### 7.1 State Machine Testing for Play/Pause/Stop/Seek/Loop

A DAW transport is a state machine. The valid states and their transitions are:

```
STOPPED --[play]--> PLAYING
PLAYING --[pause]--> PAUSED
PAUSED  --[play]--> PLAYING
PLAYING --[stop]--> STOPPED
PAUSED  --[stop]--> STOPPED
PLAYING --[seek]--> PLAYING  (continues at new position)
PAUSED  --[seek]--> PAUSED   (position changes, remains paused)
PLAYING --[loop end]--> PLAYING (if loop enabled, wraps to loop start)
```

State machine tests must verify:
1. Each transition produces the correct next state
2. Invalid transitions are rejected or no-op
3. State invariants are maintained (e.g., playhead position is monotonically increasing while PLAYING)

```typescript
// Example transport state machine test
describe('Transport state machine', () => {
  let transport: Transport; // Application-specific implementation

  beforeEach(() => {
    transport = new Transport({ bpm: 120, sampleRate: 44100 });
  });

  it('starts in STOPPED state', () => {
    expect(transport.state).toBe('stopped');
    expect(transport.position).toBe(0);
  });

  it('transitions STOPPED -> PLAYING on play()', () => {
    transport.play();
    expect(transport.state).toBe('playing');
  });

  it('transitions PLAYING -> PAUSED on pause()', () => {
    transport.play();
    transport.pause();
    expect(transport.state).toBe('paused');
  });

  it('resumes from paused position on play() after pause()', async () => {
    transport.play();
    // Simulate time passing
    await advanceTime(transport, 1.0); // 1 second
    const pausePosition = transport.position;
    transport.pause();

    await advanceTime(transport, 0.5); // Paused: position should not advance
    expect(transport.position).toBe(pausePosition);

    transport.play();
    await advanceTime(transport, 0.5);
    // Position should be pausePosition + 0.5 (not 0.0 + 1.5)
    expect(Math.abs(transport.position - (pausePosition + 0.5))).toBeLessThan(0.01);
  });

  it('resets position to 0 on stop()', () => {
    transport.play();
    transport.stop();
    expect(transport.state).toBe('stopped');
    expect(transport.position).toBe(0);
  });

  it('seek during PLAYING changes position without stopping', async () => {
    transport.play();
    await advanceTime(transport, 0.5);
    transport.seek(2.0);
    expect(transport.state).toBe('playing');
    expect(Math.abs(transport.position - 2.0)).toBeLessThan(0.01);
  });

  it('loop: playhead wraps at loop end point', async () => {
    transport.setLoop({ start: 0, end: 1.0, enabled: true });
    transport.play();
    await advanceTime(transport, 0.99);
    expect(transport.position).toBeLessThan(1.0);

    await advanceTime(transport, 0.02); // cross loop boundary
    expect(transport.position).toBeLessThan(0.1); // wrapped
  });
});
```

### 7.2 Timing Accuracy Verification

A sequencer schedules notes at positions within the transport timeline. Timing accuracy tests verify that notes are rendered at the correct sample positions.

```typescript
it('sequencer event fires at the scheduled bar position', async () => {
  const BPM = 120;
  const SR = 44100;
  const SECONDS_PER_BEAT = 60 / BPM;
  const BEAT_1_TIME = SECONDS_PER_BEAT; // Schedule note on beat 2 (t = 0.5 s at 120 BPM)
  const EXPECTED_SAMPLE = Math.round(BEAT_1_TIME * SR); // Sample 22050

  const DURATION = BEAT_1_TIME + 0.1;
  const N = Math.ceil(DURATION * SR);

  const ctx = new OfflineAudioContext(1, N, SR);

  // Sequencer places a click (impulse) at beat 2
  const clickBuffer = ctx.createBuffer(1, 1, SR);
  clickBuffer.getChannelData(0)[0] = 1.0;
  const source = ctx.createBufferSource();
  source.buffer = clickBuffer;
  source.connect(ctx.destination);
  source.start(BEAT_1_TIME);

  const buffer = await ctx.startRendering();
  const samples = buffer.getChannelData(0);

  // Find the impulse position
  let impulsePos = -1;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i] > 0.5) { impulsePos = i; break; }
  }

  expect(impulsePos).toBeGreaterThan(0);
  // Allow 1 render quantum of scheduling granularity (128 samples)
  expect(Math.abs(impulsePos - EXPECTED_SAMPLE)).toBeLessThan(128);
});
```

### 7.3 Tempo Change Accuracy

DAWs support tempo changes: either instantaneous (at a beat boundary) or ramped (tempo automation). Testing tempo changes requires verifying that the beat clock tracks the tempo map correctly.

```typescript
it('tempo change from 120 to 140 BPM is reflected in note timing', async () => {
  const SR = 44100;

  // At 120 BPM: beat duration = 0.5 s
  // At beat 4 (t = 2.0 s): change to 140 BPM (beat duration = 0.4286 s)
  // Beat 5 should fire at t = 2.0 + 60/140 = 2.4286 s

  const ctx = new OfflineAudioContext(1, SR * 3, SR);

  function placeImpulse(time: number): void {
    const buf = ctx.createBuffer(1, 1, SR);
    buf.getChannelData(0)[0] = 1.0;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(time);
  }

  // Beats 1-4 at 120 BPM
  for (let beat = 0; beat < 4; beat++) {
    placeImpulse(beat * (60 / 120));
  }
  // Beat 5 at new tempo 140 BPM: starts at 4 * 0.5 + 1 * (60/140)
  placeImpulse(4 * (60 / 120) + (60 / 140));

  const buffer = await ctx.startRendering();
  const samples = buffer.getChannelData(0);

  // Find impulse positions
  const impulsePositions: number[] = [];
  for (let i = 1; i < samples.length - 1; i++) {
    if (samples[i] > 0.5 && samples[i - 1] < 0.1) {
      impulsePositions.push(i);
    }
  }

  expect(impulsePositions.length).toBe(5);

  // Verify beat 5 fires at the correct tempo-mapped position
  const beat5Expected = Math.round((4 * (60 / 120) + (60 / 140)) * SR);
  const beat5Actual = impulsePositions[4];
  expect(Math.abs(beat5Actual - beat5Expected)).toBeLessThan(128);
});
```

### 7.4 Loop Point Accuracy

Loop accuracy requires that the playhead wraps at exactly the specified loop-end sample, producing seamless repetition.

```typescript
it('loop end produces seamless wrap at sample boundary', async () => {
  const SR = 44100;
  const LOOP_START_S = 0.5;
  const LOOP_END_S = 1.0;
  const LOOP_DURATION_SAMPLES = Math.round((LOOP_END_S - LOOP_START_S) * SR);

  // Create a known-phase sine that we can verify wraps correctly
  const sineBuf = new Float32Array(Math.round(SR * 2));
  for (let i = 0; i < sineBuf.length; i++) {
    sineBuf[i] = Math.sin(2 * Math.PI * 440 * i / SR);
  }

  const ctx = new OfflineAudioContext(1, SR * 3, SR);
  const buffer = ctx.createBuffer(1, sineBuf.length, SR);
  buffer.copyToChannel(sineBuf, 0);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = LOOP_START_S;
  source.loopEnd = LOOP_END_S;
  source.connect(ctx.destination);
  source.start(0);

  const rendered = await ctx.startRendering();
  const out = rendered.getChannelData(0);

  // After loop-end, output at LOOP_END_SAMPLES+1 should match output at LOOP_START_SAMPLES+1
  const loopEndSample = Math.round(LOOP_END_S * SR);
  const loopStartSample = Math.round(LOOP_START_S * SR);

  // Compare samples immediately after wrap
  for (let i = 0; i < 100; i++) {
    const afterWrap = out[loopEndSample + i];
    const atStart = sineBuf[loopStartSample + i];
    expect(Math.abs(afterWrap - atStart)).toBeLessThan(1e-5);
  }
});
```

---

## 8. Integration Testing for Audio Graphs

### 8.1 Testing Complex Audio Routing

A professional audio application routes signals through sends, buses, and auxiliary channels. Integration tests must verify that:
- Signal flows correctly through the intended path
- Levels are correct at each routing stage
- Side-chain inputs receive the correct signal

```typescript
describe('Audio routing integration', () => {
  it('send bus receives signal at the correct level', async () => {
    const SR = 44100;
    const N = SR * 0.2;

    // Graph: OscA -> mainBus (gain 1.0); OscA -> sendBus (gain 0.3)
    const ctx = new OfflineAudioContext(2, N, SR); // 2 channels: main, send

    const osc = ctx.createOscillator();
    osc.frequency.value = 1000;

    // Main bus: channel 0
    const mainMerger = ctx.createChannelMerger(2);
    const mainGain = ctx.createGain();
    mainGain.gain.value = 1.0;

    // Send bus: channel 1
    const sendGain = ctx.createGain();
    sendGain.gain.value = 0.3;

    osc.connect(mainGain);
    osc.connect(sendGain);

    // Use ChannelMerger to route main to L, send to R
    mainGain.connect(mainMerger, 0, 0);
    sendGain.connect(mainMerger, 0, 1);
    mainMerger.connect(ctx.destination);
    osc.start(0);

    const buffer = await ctx.startRendering();
    const mainSamples = buffer.getChannelData(0);
    const sendSamples = buffer.getChannelData(1);

    const mainRMS = computeRMS(mainSamples);
    const sendRMS = computeRMS(sendSamples);

    // Send should be 0.3x the main level
    expect(Math.abs(sendRMS / mainRMS - 0.3)).toBeLessThan(0.01);
  });
});
```

### 8.2 Testing Mixer Operations: Fader, Pan, Mute, Solo

```typescript
describe('Mixer operations', () => {
  async function renderStereoMix(
    channels: Array<{ frequency: number; gain: number; pan: number; mute: boolean }>
  ): Promise<{ left: Float32Array; right: Float32Array }> {
    const SR = 44100;
    const N = SR * 0.2;
    const ctx = new OfflineAudioContext(2, N, SR);

    for (const ch of channels) {
      if (ch.mute) continue;

      const osc = ctx.createOscillator();
      osc.frequency.value = ch.frequency;

      const gainNode = ctx.createGain();
      gainNode.gain.value = ch.gain;

      const panNode = ctx.createStereoPanner();
      panNode.pan.value = ch.pan; // -1 (full left) to +1 (full right)

      osc.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(ctx.destination);
      osc.start(0);
    }

    const buffer = await ctx.startRendering();
    return {
      left: buffer.getChannelData(0),
      right: buffer.getChannelData(1),
    };
  }

  it('pan hard-left sends signal only to left channel', async () => {
    const { left, right } = await renderStereoMix([
      { frequency: 440, gain: 1.0, pan: -1.0, mute: false },
    ]);
    expect(computeRMS(left)).toBeGreaterThan(0.1);
    expect(computeRMS(right)).toBeLessThan(0.001); // Right should be silent
  });

  it('muted channel produces no output', async () => {
    const { left } = await renderStereoMix([
      { frequency: 440, gain: 1.0, pan: 0, mute: true },
    ]);
    expect(computeRMS(left)).toBeLessThan(0.001);
  });

  it('fader at -inf dB produces silence', async () => {
    const { left } = await renderStereoMix([
      { frequency: 440, gain: 0, pan: 0, mute: false },
    ]);
    expect(computeRMS(left)).toBeLessThan(1e-7);
  });
});
```

### 8.3 Testing Effects Chains: Order, Bypass, Parameter Changes

Effects chain tests must verify that signal processing order is correct (pre-filter before post-filter) and that bypass routes signal around an effect without altering it.

```typescript
describe('Effects chain', () => {
  it('bypass routes signal unmodified around the effect', async () => {
    const SR = 44100;
    const N = SR * 0.2;

    async function renderWithEffect(bypass: boolean): Promise<Float32Array> {
      const ctx = new OfflineAudioContext(1, N, SR);
      const osc = ctx.createOscillator();
      osc.frequency.value = 1000;

      if (bypass) {
        // Bypass: direct connection
        osc.connect(ctx.destination);
      } else {
        // Inline filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500; // Will attenuate 1000 Hz
        osc.connect(filter);
        filter.connect(ctx.destination);
      }
      osc.start(0);
      const buffer = await ctx.startRendering();
      return buffer.getChannelData(0);
    }

    const bypassed = await renderWithEffect(true);
    const processed = await renderWithEffect(false);

    const bypassedRMS = computeRMSdBFS(bypassed);
    const processedRMS = computeRMSdBFS(processed);

    // Filter at cutoff 500 Hz should attenuate 1000 Hz by at least 6 dB
    expect(bypassedRMS - processedRMS).toBeGreaterThan(6);
  });
});
```

---

## 9. Cross-Browser Audio Testing

### 9.1 WebAudio API Behavioral Differences

The W3C Web Audio specification leaves several aspects implementation-defined, resulting in behavioral differences that must be accounted for in tests:

**BiquadFilter coefficient interpolation**: Chrome interpolates filter coefficients per-sample when `frequency` or `Q` is automated; older Firefox and Safari implementations interpolated per-quantum (128 samples). This produces audibly different results for fast filter sweeps.

**Oscillator start phase**: the Web Audio specification does not define the initial phase of an `OscillatorNode`. Chrome and Firefox both start at phase 0, but this is not guaranteed. Tests should never assert sample-level equality for the first few samples of an oscillator unless phase initialization is explicitly controlled.

**AudioWorklet execution context**: Safari prior to version 17.4 ran AudioWorklet processors on the main thread rather than a dedicated audio thread, significantly affecting timing guarantees.

**`outputLatency` accuracy**: `AudioContext.outputLatency` is frequently reported as 0 on Safari (it was not implemented until Safari 17) and on Chrome in headless mode.

```typescript
// Browser-adaptive tolerance helper
function getAudioTolerance(): number {
  const ua = navigator.userAgent;
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 1e-3; // Safari has slightly different floating-point paths
  }
  return 1e-5;   // Chrome/Firefox default
}
```

### 9.2 Playwright Strategies for Audio Testing

Playwright supports headless Chrome, Firefox, and WebKit. For audio tests, key configuration concerns are:

1. **Autoplay policy bypass**: Playwright can bypass autoplay restrictions using `browserContext.grantPermissions` or via launch arguments
2. **Fake audio output**: use `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` in Chrome to enable MediaStream access without real hardware
3. **OfflineAudioContext in page context**: Playwright page scripts can run OfflineAudioContext rendering via `page.evaluate()`

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium-audio',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--autoplay-policy=no-user-gesture-required',
            '--disable-audio-output-hardware', // Prevent actual audio output in CI
          ],
        },
      },
    },
    {
      name: 'firefox-audio',
      use: {
        browserName: 'firefox',
        firefoxUserPrefs: {
          'media.autoplay.default': 0, // Allow autoplay
          'media.navigator.permission.disabled': true,
        },
      },
    },
  ],
});
```

```typescript
// Playwright e2e audio test
import { test, expect } from '@playwright/test';

test('DAW renders audio correctly end-to-end', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Run OfflineAudioContext test in page context
  const { rmsDB, peakFreq } = await page.evaluate(async () => {
    const ctx = new OfflineAudioContext(1, 44100 * 0.5, 44100);
    const osc = ctx.createOscillator();
    osc.frequency.value = 440;
    osc.connect(ctx.destination);
    osc.start(0);
    const buffer = await ctx.startRendering();
    const samples = buffer.getChannelData(0);

    let sum = 0;
    let peak = 0;
    for (const s of samples) {
      sum += s * s;
      if (Math.abs(s) > peak) peak = Math.abs(s);
    }
    const rms = Math.sqrt(sum / samples.length);

    return {
      rmsDB: 20 * Math.log10(rms),
      peakDB: 20 * Math.log10(peak),
    };
  });

  expect(rmsDB).toBeGreaterThan(-10);
  expect(rmsDB).toBeLessThan(-2);
});
```

### 9.3 Headless Browser Audio Support and Limitations

Headless browser environments in CI have several limitations for audio testing:

| Limitation | Impact | Mitigation |
|---|---|---|
| No audio hardware | `outputLatency` = 0, latency tests invalid | Use `OfflineAudioContext` for functional tests |
| Restricted sample rates | Some headless environments only support 44100 Hz | Parameterize tests by sample rate |
| Autoplay blocked by default | `AudioContext` creation may fail | Use `--autoplay-policy=no-user-gesture-required` |
| No getUserMedia hardware | MediaStream tests fail | Use `--use-fake-device-for-media-stream` |
| GC pressure in CI | More variable timing | Use `OfflineAudioContext`; avoid timing-sensitive tests |
| Safari WebKit in CI | Limited server-side WebKit support | Run Safari tests on macOS GitHub Actions runners |

### 9.4 CI/CD Pipeline Configuration

```yaml
# .github/workflows/audio-tests.yml
name: Audio Tests

on: [push, pull_request]

jobs:
  audio-unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      # Vitest runs in Node.js with jsdom/happy-dom: use OfflineAudioContext polyfill
      - run: npm run test:audio:unit

  audio-e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install chromium firefox
      - run: npm run test:audio:e2e
        env:
          # Chrome args configured in playwright.config.ts
          CI: true

  audio-safari-tests:
    # Safari requires macOS runner
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install webkit
      - run: npm run test:audio:safari
```

---

## 10. Performance Testing

### 10.1 CPU Usage Measurement During Audio Processing

CPU profiling for audio requires measuring the time spent in the audio processing callback relative to the available budget. At 44100 Hz with 128-sample quanta, the audio thread has a budget of approximately 2.9 ms per quantum.

In tests, OfflineAudioContext rendering time relative to audio duration is a proxy for CPU intensity:

```typescript
async function measureRenderingLoad(
  buildGraph: (ctx: OfflineAudioContext) => void,
  durationSeconds: number,
  sampleRate: number = 44100
): Promise<{ realTimeFactor: number; renderTimeMs: number }> {
  const N = Math.ceil(durationSeconds * sampleRate);
  const ctx = new OfflineAudioContext(2, N, sampleRate);
  buildGraph(ctx);

  const start = performance.now();
  await ctx.startRendering();
  const renderTimeMs = performance.now() - start;

  const audioDurationMs = durationSeconds * 1000;
  const realTimeFactor = renderTimeMs / audioDurationMs;

  return { realTimeFactor, renderTimeMs };
}

// Test: complex graph renders faster than real-time (rtf < 1.0)
it('64-voice synth renders in less than real time', async () => {
  const { realTimeFactor } = await measureRenderingLoad(
    (ctx) => buildVoicePolyphony(ctx, 64),
    5.0
  );
  // RTF < 1.0 means rendering faster than real time (acceptable for CI)
  // RTF < 0.3 is comfortable for real-time use with headroom
  expect(realTimeFactor).toBeLessThan(1.0);
  console.info(`Real-time factor: ${realTimeFactor.toFixed(3)}x`);
}, 60000);
```

### 10.2 Voice Polyphony Stress Testing

Polyphony stress tests establish the maximum voice count at which the application maintains stable audio output. The test increments voice count until either rendering exceeds real-time or output quality degrades.

```typescript
async function findMaxStablePolyphony(
  voiceFactory: (ctx: OfflineAudioContext, index: number) => void,
  maxVoices: number = 256,
  rtfTarget: number = 0.8 // must render at 80% of real-time to be stable
): Promise<number> {
  let maxStable = 0;

  for (let voices = 8; voices <= maxVoices; voices += 8) {
    const { realTimeFactor } = await measureRenderingLoad(
      (ctx) => {
        for (let i = 0; i < voices; i++) voiceFactory(ctx, i);
      },
      2.0
    );

    if (realTimeFactor > rtfTarget) {
      break;
    }
    maxStable = voices;
  }

  return maxStable;
}

it('documents maximum stable polyphony', async () => {
  const maxVoices = await findMaxStablePolyphony(buildSynthVoice);
  console.info(`Maximum stable polyphony: ${maxVoices} voices`);
  // Regression test: should not regress below minimum acceptable value
  expect(maxVoices).toBeGreaterThanOrEqual(32);
}, 120000);
```

### 10.3 Memory Leak Detection for Long-Running Sessions

Audio applications are typically long-running sessions. Memory leaks in the audio graph -- typically caused by creating AudioNodes without disconnecting them -- can accumulate to cause degraded performance or crashes.

```typescript
// Simulate a long session: create/destroy audio nodes repeatedly
it('AudioNode lifecycle does not leak memory', async () => {
  const ITERATIONS = 1000;

  const startHeap = process.memoryUsage().heapUsed;

  for (let i = 0; i < ITERATIONS; i++) {
    const ctx = new OfflineAudioContext(1, 128, 44100);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);
    osc.start(0);

    await ctx.startRendering();

    // Explicit disconnect is important for preventing leaks
    filter.disconnect();
    gain.disconnect();
    osc.disconnect();
    // OfflineAudioContext is GC'd when out of scope
  }

  // Force GC if available (Node.js with --expose-gc)
  if (global.gc) global.gc();

  const endHeap = process.memoryUsage().heapUsed;
  const heapGrowthMB = (endHeap - startHeap) / (1024 * 1024);

  console.info(`Heap growth after ${ITERATIONS} iterations: ${heapGrowthMB.toFixed(1)} MB`);
  // Allow 10 MB growth for caching/JIT overhead
  expect(heapGrowthMB).toBeLessThan(10);
});
```

### 10.4 AudioWorklet Memory Profiling

AudioWorklet processors run in a dedicated audio context. Memory leaks within worklet processors manifest as audio thread heap growth that cannot easily be observed from the main thread. The approach for testing is to use `process.measureUserAgentSpecificMemory()` (Chrome only, requires cross-origin isolation) or to infer leaks from performance degradation.

```typescript
// AudioWorklet memory leak proxy test: RTF should remain stable over time
it('AudioWorklet processing time does not grow over long sessions', async () => {
  const SEGMENT_DURATION = 5; // seconds per segment
  const SEGMENT_COUNT = 10;
  const SR = 44100;

  const rtfSamples: number[] = [];

  for (let segment = 0; segment < SEGMENT_COUNT; segment++) {
    const N = SR * SEGMENT_DURATION;
    const ctx = new OfflineAudioContext(1, N, SR);
    await ctx.audioWorklet.addModule('test-worklet.js');

    const workletNode = new AudioWorkletNode(ctx, 'test-processor');
    workletNode.connect(ctx.destination);

    const start = performance.now();
    await ctx.startRendering();
    const elapsed = performance.now() - start;

    rtfSamples.push(elapsed / (SEGMENT_DURATION * 1000));
  }

  // RTF should not trend upward significantly
  const firstHalfRTF = rtfSamples.slice(0, 5).reduce((a, b) => a + b) / 5;
  const secondHalfRTF = rtfSamples.slice(5).reduce((a, b) => a + b) / 5;

  // Second half should not be more than 50% slower than first half
  expect(secondHalfRTF).toBeLessThan(firstHalfRTF * 1.5);
});
```

---

## 11. Testing Architecture for a DAW

### 11.1 The Audio Test Pyramid

A healthy test suite for a browser-based DAW follows a pyramid structure with three tiers:

```
         /\
        /  \
       / E2E \         <- User workflows (Playwright, 5-10 tests)
      /--------\
     /Integration\     <- Audio graph, transport, routing (50-100 tests)
    /------------\
   /  Unit (DSP)  \    <- Oscillator, filter, envelope, DSP (200+ tests)
  /________________\
```

**Unit tier (DSP)**: individual DSP components tested in isolation using `OfflineAudioContext`. These tests are fast (< 100 ms each), deterministic, and require no browser environment beyond Web Audio API availability. Run on every commit.

**Integration tier**: audio graph routing, transport state machine, mixer operations, effects chains. These tests compose multiple components and verify emergent behavior. Run on every commit but may take longer (up to 5 s per test for complex renders).

**E2E tier**: user-visible workflows (record a clip, apply an effect, export audio, undo/redo). These tests use Playwright with real browser automation. Run on pull request merge and nightly.

### 11.2 Mock Strategies

For unit tests of application logic that interacts with Web Audio (but does not need to verify audio output), mocking the Web Audio API avoids the overhead of `OfflineAudioContext` rendering.

```typescript
// MockAudioContext: structural mock for testing application logic
export class MockAudioContext {
  readonly sampleRate = 44100;
  readonly currentTime = 0;
  readonly state: AudioContextState = 'running';

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode(this);
  }

  createGain(): MockGainNode {
    return new MockGainNode(this);
  }

  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode(this);
  }

  get destination(): MockAudioNode {
    return new MockAudioNode(this);
  }
}

export class MockAudioNode {
  private _connections: MockAudioNode[] = [];
  constructor(protected ctx: MockAudioContext) {}

  connect(destination: MockAudioNode): MockAudioNode {
    this._connections.push(destination);
    return destination;
  }

  disconnect(destination?: MockAudioNode): void {
    if (destination) {
      this._connections = this._connections.filter((c) => c !== destination);
    } else {
      this._connections = [];
    }
  }

  get connections(): MockAudioNode[] {
    return [...this._connections];
  }
}

export class MockAudioParam {
  private _value: number;
  readonly automationEvents: Array<{ type: string; value: number; time: number }> = [];

  constructor(initialValue: number) {
    this._value = initialValue;
  }

  get value(): number { return this._value; }
  set value(v: number) { this._value = v; }

  setValueAtTime(value: number, time: number): MockAudioParam {
    this.automationEvents.push({ type: 'setValueAtTime', value, time });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number): MockAudioParam {
    this.automationEvents.push({ type: 'linearRamp', value, time });
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number): MockAudioParam {
    this.automationEvents.push({ type: 'exponentialRamp', value, time });
    return this;
  }
}

export class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam(440);
  detune = new MockAudioParam(0);
  private _started = false;
  private _stopped = false;

  start(when?: number): void {
    this._started = true;
  }

  stop(when?: number): void {
    this._stopped = true;
  }

  get started(): boolean { return this._started; }
  get stopped(): boolean { return this._stopped; }
}

export class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam(1.0);
}

export class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new MockAudioParam(350);
  Q = new MockAudioParam(1.0);
  gain = new MockAudioParam(0);

  getFrequencyResponse(
    _frequencyArray: Float32Array,
    _magResponse: Float32Array,
    _phaseResponse: Float32Array
  ): void {
    // No-op in mock; use real OfflineAudioContext for response tests
  }
}

// Usage: test that SynthVoice creates the correct graph structure
it('SynthVoice creates expected audio graph', () => {
  const ctx = new MockAudioContext() as unknown as AudioContext;
  const voice = new SynthVoice(ctx);

  expect(voice.oscillator.connections.length).toBeGreaterThan(0);
  expect(voice.filter.type).toBe('lowpass');
});
```

### 11.3 Fixture Management

Audio test fixtures include:
- **Reference audio files**: golden buffers for regression tests (stored as `.f32` raw float32 or `.wav` PCM)
- **Preset snapshots**: JSON serializations of synthesizer state for regression testing
- **MIDI fixture sequences**: deterministic note sequences for transport tests

```typescript
// Fixture loader with path resolution
import { join } from 'path';
import { readFileSync } from 'fs';

const FIXTURE_DIR = join(__dirname, '__fixtures__');

export function loadAudioFixture(name: string): Float32Array {
  const path = join(FIXTURE_DIR, 'audio', `${name}.f32`);
  const bytes = readFileSync(path);
  return new Float32Array(bytes.buffer);
}

export function loadPresetFixture<T>(name: string): T {
  const path = join(FIXTURE_DIR, 'presets', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

// Fixture directory structure:
// __fixtures__/
//   audio/
//     808-standard-params.f32
//     hi-hat-default.f32
//     snare-tight.f32
//   presets/
//     default-synth.json
//     bass-lead.json
//   midi/
//     four-on-floor.mid
```

### 11.4 Vitest Configuration for Web Audio

Vitest with `jsdom` or `happy-dom` environment does not include a Web Audio API implementation. Two strategies are available:

**Strategy A: Web Audio polyfill** (for unit tests that need audio rendering):
Use `web-audio-api` Node.js package which provides a native `OfflineAudioContext` implementation.

**Strategy B: Browser mode** (for tests that need a real browser Web Audio implementation):
Use Vitest's browser mode (`--browser`) with Playwright to run tests in a real browser context.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Project split: unit tests use node + polyfill, integration tests use browser mode
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.unit.test.ts'],
          setupFiles: ['./tests/setup/web-audio-polyfill.ts'],
          globals: true,
        },
      },
      {
        test: {
          name: 'browser',
          browser: {
            enabled: true,
            provider: 'playwright',
            name: 'chromium',
            launchOptions: {
              args: ['--autoplay-policy=no-user-gesture-required'],
            },
          },
          include: ['src/**/*.browser.test.ts'],
          globals: true,
        },
      },
    ],
  },
});
```

```typescript
// tests/setup/web-audio-polyfill.ts
// Installs web-audio-api polyfill for Node.js unit tests
import { AudioContext, OfflineAudioContext } from 'web-audio-api';

// Make available as globals matching browser API
Object.assign(globalThis, { AudioContext, OfflineAudioContext });
```

```typescript
// tests/setup/audio-test-helpers.ts
// Shared helper functions imported by all audio test files

export { computeRMS, computeRMSdBFS, computePeakdBFS } from './level-helpers';
export { computeFFTMagnitude, findPeakFrequency, refinePeakFrequency } from './fft-helpers';
export { detectDiscontinuities, detectZeroRunGlitches, detectClipping } from './glitch-detection';
export { assertBuffersClose, matchesAudioSnapshot } from './snapshot-helpers';
```

### 11.5 Test Timeout Configuration

Audio rendering tests that involve long buffers or complex graphs require generous timeouts. Configure timeouts at the test level rather than globally to avoid masking hanging tests.

```typescript
// Timeout guidelines:
// Unit tests (< 500 ms audio): 5 s timeout
// Integration tests (< 5 s audio): 15 s timeout
// Stress tests / polyphony tests: 60 s timeout
// E2E tests: 30 s timeout (include browser startup)

describe('DSP unit tests', { timeout: 5000 }, () => {
  it('renders 100 ms sine wave', async () => {
    // Completes in < 100 ms typically
  });
});

describe('Polyphony stress tests', { timeout: 60000 }, () => {
  it('renders 64-voice patch', async () => {
    // May take several seconds for complex voices
  });
});
```

---

## 12. Comparative Synthesis

### 12.1 Verification Approach Selection Guide

| Test target | Recommended approach | Key metric | Tolerance |
|---|---|---|---|
| Oscillator pitch accuracy | FFT peak frequency | Hz deviation | < 1 Hz |
| Oscillator waveform type | FFT harmonic distribution | Harmonic ratios | < 5% |
| Filter frequency response | `getFrequencyResponse()` or sweep+FFT | dB vs. target | < 1 dB |
| Filter phase response | `getFrequencyResponse()` phase | degrees vs. target | < 5 deg |
| Gain stage level | RMS comparison | dB deviation | < 0.1 dB |
| Mixer clipping | Peak detection | Samples above 1.0 | 0 |
| ADSR envelope shape | Amplitude at time points | Amplitude deviation | < 0.05 |
| Sequencer timing | Impulse position in buffer | Samples from target | < 128 |
| Loop accuracy | Sample match at wrap point | Per-sample delta | < 1e-5 |
| Transport state | State machine assertion | State enumeration | Exact |
| Synthesis chain regression | Golden file comparison | Per-sample delta | < 1e-4 |
| LTI property | Superposition check | Max absolute error | < 1e-4 |
| CPU load | Real-time factor | RTF vs. 1.0 | < 0.8 |
| Memory stability | Heap growth over iterations | MB growth | < 10 MB |

### 12.2 OfflineAudioContext vs. Live AudioContext for Tests

| Dimension | OfflineAudioContext | Live AudioContext |
|---|---|---|
| Determinism | Fully deterministic | Non-deterministic (scheduling, GC) |
| Speed | As fast as CPU allows | Real-time only |
| Hardware dependency | None | Requires audio device |
| Headless CI | Fully supported | Requires virtual audio device |
| Latency testing | Cannot measure real latency | Required for latency tests |
| UserAgent interaction | Not required | Requires autoplay gesture workaround |
| Use case | All functional/regression tests | Latency, glitch in real-time, E2E |

The decision rule is simple: use `OfflineAudioContext` for all tests except those that explicitly need real-time behavior.

### 12.3 Testing Stack Recommendations by Layer

| Test type | Framework | Environment | Runtime |
|---|---|---|---|
| DSP unit tests | Vitest | Node.js + polyfill | < 5 s total |
| Audio graph integration | Vitest browser mode | Chromium headless | < 30 s total |
| Transport state machine | Vitest | Node.js (no audio needed) | < 5 s total |
| Cross-browser | Playwright | Chrome + Firefox + WebKit | < 2 min |
| Performance regression | Vitest + custom reporter | Chromium headless | < 2 min |
| E2E user workflows | Playwright | Chromium + full app | < 5 min |

---

## 13. Open Problems and Limitations

### 13.1 Perceptual Audio Quality Metrics

The test methodologies presented here operate at the signal level: RMS, FFT, sample comparison. They do not address perceptual audio quality -- the question of whether a processed signal sounds good to a human listener. Perceptual metrics (PESQ, POLQA, VISQOL) exist but require specialized libraries and have high computational cost. Their integration into automated test suites remains an open engineering problem.

Current practice is to use signal-level metrics as proxies for perceptual quality, accepting that some perceptually significant artifacts (e.g., subtle intermodulation distortion, aliasing in high-frequency content) may not be caught by RMS or FFT peak tests alone.

### 13.2 Non-Determinism in AudioWorklet

While `OfflineAudioContext` eliminates real-time scheduling variance, AudioWorklet processors that use `Math.random()` or time-dependent logic internally are non-deterministic even in offline rendering. Tests for such processors must either:
- Seed random number generators (requires exposing RNG state via `MessagePort`)
- Use property-based tests that validate invariants rather than exact outputs
- Accept a tolerance wide enough to accommodate the non-determinism

### 13.3 Cross-Browser Golden Files

Golden-file tests that pass in Chromium will fail in WebKit if browser implementations differ. The current practice is to maintain per-browser golden files, but this doubles maintenance burden. An alternative is to use spectral/level comparison tests that are implementation-agnostic, accepting that they provide weaker regression guarantees.

### 13.4 AudioWorklet Testing in Node.js

The `web-audio-api` Node.js polyfill has partial AudioWorklet support. Complex worklet processors using `SharedArrayBuffer`, WASM, or advanced `AudioParam` automation may not behave identically in the polyfill and in a real browser. For AudioWorklet-heavy code, Vitest browser mode is required rather than the Node.js polyfill, accepting the associated CI overhead.

### 13.5 Timing Tests in Virtualized CI Environments

Performance tests (RTF measurement, CPU stress tests) produce highly variable results in virtualized CI environments (GitHub Actions, GitLab CI). A "pass when RTF < 0.8" test may intermittently fail when the CI runner is under load. The standard mitigation is to:
- Use looser RTF bounds in CI (< 2.0) with strict bounds as local development guidelines
- Track RTF as a metric rather than a binary pass/fail gate
- Run performance tests on dedicated bare-metal runners when accurate measurements are required

---

## 14. Conclusion

Audio quality assurance for browser-based applications requires assembling techniques from signal processing theory, formal methods, property-based testing, and browser automation into a coherent testing strategy. The primary obstacle to this work is the perception that audio output cannot be expressed as a pass/fail criterion -- a perception that the `OfflineAudioContext`-based approach directly refutes.

The key principles established in this survey:

1. **Use `OfflineAudioContext` for all functional tests.** It eliminates real-time non-determinism, requires no hardware, and renders as fast as possible. This single choice makes previously untestable audio logic testable.

2. **Choose the oracle level appropriate to the test target.** RMS for gain stages; FFT peak for oscillators; frequency response curves for filters; sample-level comparison for regression tests. No single oracle works for all scenarios.

3. **Apply LTI metamorphic properties for DSP validation.** Superposition, scaling, and time-invariance tests catch whole classes of implementation errors that example-based tests cannot.

4. **Test the transport as a state machine.** Enumerate states and transitions explicitly; verify every transition including invalid ones.

5. **Separate mock-based structural tests from real-audio functional tests.** Mocks verify that application logic creates the correct graph topology; OfflineAudioContext tests verify that the graph produces the correct audio.

6. **Account for cross-browser differences with adaptive tolerances.** Never assert sample-level equality across browsers; use spectral and level comparisons with browser-appropriate tolerance values.

7. **Detect glitches programmatically.** Buffer underruns, clicks, and unintended silence can all be detected algorithmically, enabling glitch detection in CI without human listening.

A comprehensive test suite built on these principles provides strong guarantees that a browser-based DAW produces correct audio output, maintains timing accuracy, and remains stable over long sessions -- making it safe for agents and engineers alike to refactor, extend, and improve the audio engine with confidence.

---

## References

1. W3C Web Audio API Specification. https://www.w3.org/TR/webaudio/ (2023, Level 1; Level 2 editor's draft 2025)
2. Bencina, R. and Burk, P. "PortAudio: Portable, Open-Source, Audio I/O." *ICMC Proceedings* (2001). Foundation for understanding audio I/O latency models.
3. Smith, J.O. "Introduction to Digital Filters with Audio Applications." W3K Publishing, 2007. https://ccrma.stanford.edu/~jos/filters/ -- frequency response mathematics for filter testing.
4. Zolzer, U. *DAFX: Digital Audio Effects*, 2nd ed. Wiley, 2011. Reference for DSP algorithm specifications used in golden-file tests.
5. Puckette, M. "The Theory and Technique of Electronic Music." World Scientific, 2007. https://msp.ucsd.edu/techniques.htm -- oscillator and envelope theory.
6. Freeman, B. "AudioWorklet: The Future of Web Audio." *Google Developers Blog*, 2018. https://developer.chrome.com/blog/audio-worklet/
7. Wilson, C. "Scheduling Web Audio." *Google Developers Blog*, 2013. https://developer.chrome.com/blog/audio-scheduling/ -- scheduling latency and timer accuracy.
8. Letz, S., Fober, D., Orlarey, Y. "FAUST: An Efficient Functional Approach to DSP Programming." *New Computational Paradigms for Computer Music* (2009). Property-based approaches to DSP testing.
9. Claessen, K. and Hughes, J. "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs." *ICFP 2000*. Foundational reference for property-based testing methodology.
10. Hamlet, R. "Special Section: Mutation Testing." *IEEE Transactions on Software Engineering* 3(4), 1977. Basis for understanding test strength for DSP code.
11. Liang, W. et al. "PESQ: An Objective Method for End-to-End Speech Quality Assessment." *ITU-T Recommendation P.862*, 2001. Perceptual audio quality measurement.
12. Loizou, P. *Speech Quality Assessment*. Cambridge University Press, 2011. Chapter 7: objective speech quality metrics.
13. Vitest Documentation. https://vitest.dev/ -- testing framework used for code examples.
14. Playwright Documentation. https://playwright.dev/ -- cross-browser automation.
15. `web-audio-api` Node.js polyfill. https://github.com/nicktindall/cycfi-audio -- enables OfflineAudioContext in Node.js test environments.
16. `fft.js` library. https://github.com/indutny/fft.js -- fast FFT implementation for browser and Node.js.
17. fast-check. https://github.com/dubzzz/fast-check -- property-based testing library for JavaScript/TypeScript.
18. Berndt, A. "Testing Digital Audio Software." *Presented at the Linux Audio Conference*, 2012. Survey of software testing approaches for audio applications.

---

## Appendix A: Practitioner Quick-Reference

### A.1 The Five-Minute Test Setup

```typescript
// tests/audio-helpers.ts -- paste this into any audio test project

import { OfflineAudioContext } from './polyfill-or-browser';

export async function renderSineWave(
  frequency: number,
  durationSeconds: number,
  sampleRate = 44100
): Promise<Float32Array> {
  const N = Math.ceil(durationSeconds * sampleRate);
  const ctx = new OfflineAudioContext(1, N, sampleRate);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  osc.connect(ctx.destination);
  osc.start(0);
  const buffer = await ctx.startRendering();
  return buffer.getChannelData(0);
}

export function rmsDB(samples: Float32Array): number {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return 20 * Math.log10(Math.sqrt(sum / samples.length));
}

export function peakFrequencyHz(samples: Float32Array, sampleRate: number): number {
  const N = samples.length;
  // Simple DFT peak finder -- replace with fft.js for production
  let maxMag = 0;
  let peakBin = 0;
  for (let k = 1; k < N / 2; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += samples[n] * Math.cos(angle);
      im -= samples[n] * Math.sin(angle);
    }
    const mag = Math.sqrt(re * re + im * im);
    if (mag > maxMag) { maxMag = mag; peakBin = k; }
  }
  return (peakBin * sampleRate) / N;
}
// NOTE: The simple DFT above is O(N^2) -- for production tests
// use fft.js or similar O(N log N) implementation.
```

### A.2 Checklist for a New Audio Component Test

When implementing tests for a new DSP component, work through this checklist:

- [ ] Smoke test: component produces non-silent output for a valid input
- [ ] Silence test: component produces silence when input is silence (for linear components)
- [ ] Level test: output RMS matches expected gain for a known input
- [ ] Frequency test: output contains the expected frequency content (FFT peak)
- [ ] Distortion test: no clipping or unexpected harmonics at nominal levels
- [ ] Parameter test: each user-facing parameter produces the expected change in output
- [ ] Glitch test: no discontinuities or zero-run artifacts in output
- [ ] Scheduling test: notes triggered at scheduled times fire within 128 samples of target
- [ ] Golden file: if complex synthesis, capture a snapshot for regression detection
- [ ] LTI property: if the component is supposed to be linear, verify superposition
