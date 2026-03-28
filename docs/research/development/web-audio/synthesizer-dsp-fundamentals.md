---
title: "Synthesizer Architecture and DSP Fundamentals for Browser-Based Audio Applications"
date: 2026-03-28
summary: "Survey of synthesizer architecture, DSP algorithms, and sound design patterns for implementing professional-grade software synthesizers using the Web Audio API and AudioWorklet, including the iconic TR-808 drum machine."
keywords: [synthesizer, dsp, web-audio, oscillators, filters, tr-808]
---

# Synthesizer Architecture and DSP Fundamentals for Browser-Based Audio Applications

*2026-03-28*

## Abstract

The Web Audio API, extended through AudioWorklet, has matured into a viable platform for professional-grade software synthesis. This survey examines the theoretical and practical landscape of digital signal processing (DSP) as applied to browser-based synthesizers, covering every major architectural layer from oscillator design through effects processing. The survey bridges classical DSP literature -- Zolzer, Smith, Puckette, Roads -- with the specific constraints and affordances of the browser audio graph: a 128-sample render quantum, a dedicated audio thread, and a JavaScript/WebAssembly processing model.

The paper addresses ten interconnected domains: oscillator design including band-limited algorithms and wavetable synthesis; filter design spanning biquad, state-variable, and analog-modeled topologies; envelope generators with exponential and multi-stage curves; low-frequency oscillators with sync and tempo modes; modulation matrix architecture; the Roland TR-808 drum machine as a worked case study in analog synthesis emulation; arpeggiator patterns; polyphony management and voice allocation; preset serialization and morphing; and effects processing from convolution reverb through parametric EQ. Each domain receives mathematical foundations, algorithmic analysis, trade-off discussion, and concrete TypeScript/Web Audio API code patterns suitable for production implementation.

The central finding is that browser-based synthesis can achieve professional quality when built around AudioWorklet-resident DSP rather than the coarse-grained native nodes, when band-limiting and anti-aliasing are applied systematically, and when the modulation system follows a clean source-amount-destination matrix that decouples routing from computation. Open problems include AudioWorklet WASM sharing constraints, consistent AudioParam scheduling latency, and the absence of native oversampling support in the Web Audio API specification.

---

## 1. Introduction

### 1.1 Problem Statement

Software synthesis in the browser faces a dual constraint: it must execute within the memory and compute budget of a shared JavaScript runtime while achieving sample-accurate audio quality indistinguishable from native desktop synthesizers. The Web Audio API (W3C, 2021) was designed for web audio effects, not for full synthesizer architectures, which means foundational DSP components -- oscillators, filters, envelopes, modulation routing -- must be implemented by the application developer, typically in AudioWorklet processors.

The consequence is that browser synthesizer authors must simultaneously master three bodies of knowledge: classical analog synthesis theory, digital DSP algorithms, and the specific scheduling and threading model of the Web Audio API. The literature treats these separately. This survey integrates them.

### 1.2 Scope

**Covered:**
- Oscillator waveform generation and anti-aliasing (PolyBLEP, wavetable, additive)
- IIR filter design: biquad coefficients, state-variable filters, analog-modeled topologies
- Envelope and LFO architectures with modulation matrix
- TR-808 drum machine synthesis recipes and their Web Audio API implementations
- Arpeggiator pattern algorithms
- Polyphony management and voice lifecycle
- Preset serialization, storage, and morphing
- Effects chain: reverb, delay, distortion, modulation effects, dynamics, EQ

**Excluded:**
- FM synthesis (Yamaha DX7 architecture) -- merits a separate survey
- Physical modeling synthesis (waveguide, finite-difference)
- Machine learning audio synthesis (RAVE, DDSP)
- MIDI protocol handling and device enumeration
- Streaming audio and Web RTC integration

### 1.3 Key Definitions

- **Sample rate (Fs)**: Samples per second; browser standard is 48000 Hz or 44100 Hz.
- **Nyquist frequency**: Fs/2; maximum representable frequency without aliasing.
- **Render quantum**: The atomic audio processing block in Web Audio API -- 128 samples.
- **AudioWorklet**: The W3C API for running custom DSP code on the audio rendering thread.
- **Partial**: A sinusoidal component of a complex waveform, at a harmonic or inharmonic frequency.
- **Aliasing**: Spectral fold-over when a signal contains energy above the Nyquist frequency.
- **Band-limited oscillator (BLO)**: An oscillator whose spectrum is bounded to [0, Nyquist].

---

## 2. Foundations

### 2.1 Discrete-Time Signal Processing

Audio in a digital system is represented as a sequence of real-valued samples x[n], where n is the sample index and the continuous-time signal x(t) is recovered via a reconstruction filter. The sampling theorem (Nyquist, Shannon) states that faithful reconstruction requires Fs > 2 * f_max, where f_max is the highest frequency in the signal.

The z-transform maps the sample-domain to a complex frequency domain:

```
X(z) = sum_{n=-inf}^{inf} x[n] * z^{-n}
```

A filter described by H(z) transforms an input signal X(z) into output Y(z) = H(z) * X(z). IIR (infinite impulse response) filters implement this as a rational transfer function:

```
H(z) = (b0 + b1*z^{-1} + b2*z^{-2}) / (1 + a1*z^{-1} + a2*z^{-2})
```

which in the time domain corresponds to the difference equation:

```
y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
```

This is the Direct Form I biquad, the workhorse of all filter implementations in this survey.

### 2.2 Frequency, Phase, and the Phase Accumulator

A digital oscillator maintains a phase variable phi in [0, 1), incremented each sample by:

```
delta_phi = f / Fs
```

where f is the desired frequency. The phase wraps modulo 1. All waveform shapes are functions of phi:

```
sine:     sin(2*pi*phi)
sawtooth: 2*phi - 1
square:   phi < duty ? 1.0 : -1.0
triangle: 4*|phi - 0.5| - 1
```

The phase accumulator is O(1) per sample and is the basis for all oscillator implementations. The aliasing problem arises because sawtooth, square, and triangle waveforms have infinite-bandwidth Fourier series, generating harmonics that fold back into the audible band when computed naively.

### 2.3 Decibels and Gain Staging

Audio levels are expressed in decibels: dB = 20*log10(|amplitude|). The human auditory system perceives loudness approximately logarithmically, making dB natural for parameter control. In a synthesizer, gain staging ensures no stage clips the signal before it reaches a final limiter. Typical convention: oscillators output at 0 dBFS peak (amplitude 1.0), VCA attenuates before mixing, final output bus targets -6 to -12 dBFS headroom.

### 2.4 Web Audio API Execution Model

The Web Audio API processes audio on a dedicated audio rendering thread separate from the main JavaScript thread. AudioWorklet processors run on this thread with a guaranteed 128-sample block period. Communication with the main thread occurs via MessagePort (asynchronous, variable latency) or AudioParam automation (sample-accurate, scheduled ahead of time).

AudioParams support two scheduling primitives relevant to synthesis:
- `setValueAtTime(value, time)`: instantaneous parameter change
- `linearRampToValueAtTime(value, endTime)`: linear interpolation
- `exponentialRampToValueAtTime(value, endTime)`: exponential interpolation
- `setTargetAtTime(target, startTime, timeConstant)`: exponential approach

For synthesis-grade envelope control, custom AudioWorklet processors implement their own envelope state machines rather than relying on these AudioParam methods, because the Web Audio API methods have quantization to render quantum boundaries in some implementations.

---

## 3. Taxonomy of Approaches

### 3.1 Synthesis Architecture Layers

A software synthesizer can be decomposed into orthogonal layers:

```
+--------------------------------------------------+
|  PRESET SYSTEM (serialization, morphing)         |
+--------------------------------------------------+
|  MODULATION MATRIX (source -> amount -> dest)    |
+--------------------------------------------------+
|  VOICE ENGINE (polyphony, voice allocation)      |
+--------------------------------------------------+
|  SIGNAL CHAIN PER VOICE                          |
|  [Oscillator(s)] -> [Filter] -> [VCA]            |
+--------------------------------------------------+
|  ENVELOPE / LFO GENERATORS (per voice / global) |
+--------------------------------------------------+
|  EFFECTS BUS (reverb, delay, distortion, etc.)  |
+--------------------------------------------------+
|  WEB AUDIO API / AudioWorklet SUBSTRATE         |
+--------------------------------------------------+
```

### 3.2 Oscillator Algorithm Taxonomy

| Algorithm       | Anti-alias | Quality   | CPU Cost | Pitch-agile |
|----------------|-----------|-----------|----------|-------------|
| Naive          | None      | Poor      | Minimal  | Yes         |
| PolyBLEP       | BLEP correction | Good | Low    | Yes         |
| BLIT           | Sinc summation | Very good | Medium | Yes      |
| Additive       | Perfect   | Perfect   | High     | Yes         |
| Wavetable      | Mipmapped | Very good | Low      | Limited     |
| MinBLEP        | Minimum-phase BLEP | Excellent | Medium | Yes  |

### 3.3 Filter Topology Taxonomy

| Topology            | Poles | Self-oscillation | Analog model   | CPU Cost |
|--------------------|-------|-----------------|---------------|----------|
| Biquad (Direct I)  | 2     | No              | Generic IIR   | Minimal  |
| State-Variable     | 2     | Yes (careful)   | Oberheim/EMS  | Low      |
| Moog Ladder        | 4     | Yes             | Moog Model D  | Medium   |
| Korg MS-20         | 2+NL  | Yes             | Sallen-Key    | Medium   |
| Chamberlin SVF     | 2     | Yes             | CEM3350       | Low      |
| Zavalishin ZDF     | 2-4   | Yes             | VA universal  | Medium   |

---

## 4. Analysis

## 4.1 Oscillator Design

### 4.1.1 Standard Waveforms and the Aliasing Problem

The ideal sawtooth wave has the Fourier series:

```
saw(phi) = (2/pi) * sum_{k=1}^{inf} (-1)^{k+1} * sin(2*pi*k*phi) / k
```

At a fundamental of 440 Hz with Fs = 48000 Hz, the Nyquist limit (24000 Hz) allows harmonics up to k = 54. The naive sawtooth generates all harmonics including k > 54, which alias back into the audible band, creating spectral "mush" that worsens at higher pitches.

Naive implementation in an AudioWorklet:

```typescript
// AudioWorkletProcessor: NaiveOscillator
// WARNING: aliasing above ~2kHz fundamental
class NaiveOscillatorProcessor extends AudioWorkletProcessor {
  private phase = 0;

  process(inputs: Float32Array[][], outputs: Float32Array[][], params: Record<string, Float32Array>): boolean {
    const output = outputs[0][0];
    const freqParam = params['frequency'];

    for (let i = 0; i < output.length; i++) {
      const freq = freqParam.length > 1 ? freqParam[i] : freqParam[0];
      const delta = freq / sampleRate;
      output[i] = 2 * this.phase - 1; // sawtooth
      this.phase = (this.phase + delta) % 1;
    }
    return true;
  }
}
```

### 4.1.2 PolyBLEP Anti-Aliasing

PolyBLEP (Polynomial Bandlimited Step) corrects the discontinuity in sawtooth and square waveforms by adding a polynomial correction term near each transition point. The correction is computed analytically from the fractional position of the discontinuity within the current sample interval.

The PolyBLEP correction for a falling edge at phase t (normalized, where 0 means the discontinuity just passed and 1 means one full cycle has elapsed) with step size dt:

```
polyBlep(t, dt):
  if t < dt:      // just after transition
    t /= dt
    return t + t - t*t - 1.0
  elif t > 1 - dt: // just before transition
    t = (t - 1) / dt
    return t*t + t + t + 1.0
  else:
    return 0.0
```

Applied to a sawtooth, the correction is subtracted at the wrap-around discontinuity. Applied to a square, it is applied at both the rising and falling edges.

```typescript
// PolyBLEP sawtooth -- production quality up to ~8kHz fundamental at 48kHz
function polyBlepSaw(phase: number, dt: number): number {
  let saw = 2.0 * phase - 1.0;
  saw -= polyBlep(phase, dt);
  return saw;
}

function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1.0;
  } else if (t > 1.0 - dt) {
    const x = (t - 1.0) / dt;
    return x * x + x + x + 1.0;
  }
  return 0.0;
}
```

**Strengths:** O(1) per sample, no tables, pitch-agile, minimal latency.
**Limitations:** 1st-order correction leaves residual aliasing above approximately Fs/6; 2nd-order PolyBLEP2 improves this significantly.

### 4.1.3 MinBLEP

MinBLEP (Minimum-phase Bandlimited step) convolves a windowed sinc (the "ideal" step correction) with a minimum-phase spectral envelope, producing a compact impulse with all its energy concentrated at the front. This allows it to be stored as a short lookup table and applied at each discontinuity.

The MinBLEP table is precomputed offline:
1. Create an oversampled sinc of length N (e.g., N = 64 * oversampling_factor)
2. Window it with a Blackman-Harris window
3. Apply a minimum-phase reconstruction via the cepstrum method
4. Store as a floating-point array

At each discontinuity, the table is mixed into an output buffer at the fractional position of the discontinuity. This requires a small "residual buffer" per oscillator voice.

**Strengths:** Near-perfect anti-aliasing; audibly transparent at all pitches up to Nyquist/2.
**Limitations:** Implementation complexity; residual buffer management; small per-sample overhead proportional to MinBLEP table length / period length.

### 4.1.4 Wavetable Synthesis

Wavetable synthesis stores one or more complete waveform cycles as arrays of floating-point samples. Playback reads the table at a rate proportional to the desired pitch. To prevent aliasing, multiple mipmapped versions of each wavetable are precomputed at different bandwidths: the version whose highest harmonic is below Nyquist for the current pitch is selected.

**Table construction:**
1. Define the waveform in the frequency domain (Fourier coefficients).
2. For each mipmap level m, zero all harmonics above Fs / (2 * pitch_range_bottom_of_level_m).
3. IFFT back to time domain.
4. Store tables contiguously in a flat `Float32Array`.

```typescript
interface WavetableBank {
  tables: Float32Array[];    // one per mipmap level
  tableSizes: number[];      // each table's sample count
  minFreqs: number[];        // minimum pitch for each table
}

function readWavetable(bank: WavetableBank, freq: number, phase: number, sampleRate: number): number {
  // Select mipmap level
  let level = 0;
  for (let i = 0; i < bank.minFreqs.length; i++) {
    if (freq >= bank.minFreqs[i]) level = i;
  }
  const table = bank.tables[level];
  const size = bank.tableSizes[level];

  // Linear interpolation between adjacent samples
  const readPos = phase * size;
  const idx0 = Math.floor(readPos) % size;
  const idx1 = (idx0 + 1) % size;
  const frac = readPos - Math.floor(readPos);
  return table[idx0] + frac * (table[idx1] - table[idx0]);
}
```

**Wavetable morphing:** Crossfade between two wavetables by linear interpolation of their outputs:

```typescript
const morphedSample = (1 - morphAmount) * readWavetable(bankA, ...) + morphAmount * readWavetable(bankB, ...);
```

For smooth spectral morphing, morphing in the frequency domain (interpolate Fourier coefficients before IFFT) produces cleaner results than time-domain crossfading.

**Strengths:** Low CPU per voice; supports arbitrary complex waveforms; morphing enables expressive timbre evolution.
**Limitations:** Wavetable precomputation cost; memory for mipmap banks; pitch resolution limited by table count.

### 4.1.5 Additive Synthesis

Additive synthesis sums sinusoidal partials, each with independent amplitude and frequency:

```
y[n] = sum_{k=1}^{K} A_k * sin(2*pi*f_k*n/Fs + phi_k)
```

Because each partial is a sine (band-limited by definition), additive synthesis is inherently alias-free. The Fourier series of a sawtooth at 440 Hz requires 54 partials at 48 kHz -- feasible but O(K) per sample.

**Resynthesis workflow:** Analyze an audio recording with an STFT, track partial amplitudes and frequencies over time, store as a time-varying additive model, resynthesize at any pitch.

**Strengths:** Perfect quality; amenable to spectral transformation.
**Limitations:** High CPU for complex timbres; analysis tools required for resynthesis.

### 4.1.6 Noise Generators

**White noise** is generated by a pseudo-random number generator (PRNG) with a flat spectral density. A linear congruential generator (LCG) or xoshiro256** are suitable for audio:

```typescript
// Xoshiro128+ -- fast, high-quality white noise
class WhiteNoise {
  private state = new Uint32Array([1, 2, 3, 4]);
  next(): number {
    const s0 = this.state[0], s1 = this.state[1];
    const result = (s0 + this.state[3]) >>> 0;
    this.state[1] ^= s0;
    this.state[3] ^= this.state[2];
    this.state[2] ^= s1;
    this.state[0] ^= this.state[3];
    this.state[3] = ((this.state[3] << 11) | (this.state[3] >>> 21)) >>> 0;
    return (result >>> 8) * (1.0 / 16777216.0) * 2 - 1;
  }
}
```

**Pink noise** (1/f spectral density, -3 dB/octave) is perceptually "neutral" colored noise. The Voss-McCartney algorithm uses a bank of white noise generators at octave-spaced update rates, summed together. Paul Kellet's 3-coefficient IIR approximation is computationally preferable:

```typescript
// Kellet pink noise filter (3 coefficients)
let b0 = 0, b1 = 0, b2 = 0;
function pinkNoise(white: number): number {
  b0 = 0.99886 * b0 + white * 0.0555179;
  b1 = 0.99332 * b1 + white * 0.0750759;
  b2 = 0.96900 * b2 + white * 0.1538520;
  return (b0 + b1 + b2 + white * 0.0168980) * 0.11;
}
```

**Brown noise** (1/f^2 spectral density, -6 dB/octave) is a simple one-pole IIR on white noise:

```typescript
let brownState = 0;
function brownNoise(white: number): number {
  brownState = (brownState + 0.02 * white) / 1.02;
  return brownState * 3.5; // normalize approximate peak
}
```

### 4.1.7 Super-Saw / Unison Detuning

The Roland JP-8000 "super saw" stacks multiple sawtooth oscillators with slightly detuned frequencies and random phase offsets. The characteristic wide sound comes from beating between the detuned partials.

```typescript
interface UnisonConfig {
  voices: number;        // typically 3-9
  detune: number;        // cents, spread across voices (e.g., 30 cents)
  stereoSpread: number;  // 0-1, pan spread
}

// Per voice: compute per-unison-oscillator frequency
function unisonFreqs(base: number, config: UnisonConfig): number[] {
  const { voices, detune } = config;
  return Array.from({ length: voices }, (_, i) => {
    const offset = voices > 1 ? (i / (voices - 1) - 0.5) * detune : 0;
    return base * Math.pow(2, offset / 1200); // cents to ratio
  });
}
```

The summed signal is normalized by `1 / sqrt(voices)` to maintain consistent perceived loudness regardless of voice count.

---

## 4.2 Filter Design

### 4.2.1 Biquad Filter Coefficients

The biquad filter transfer function (two poles, two zeros):

```
H(z) = (b0 + b1*z^{-1} + b2*z^{-2}) / (1 + a1*z^{-1} + a2*z^{-2})
```

RBJ Audio EQ Cookbook (Robert Bristow-Johnson) provides design equations for all standard filter types from three parameters: cutoff frequency fc (Hz), sample rate Fs, and quality factor Q.

Intermediate variables:
```
w0 = 2*pi*fc/Fs
cos_w0 = cos(w0)
sin_w0 = sin(w0)
alpha = sin_w0 / (2*Q)
```

**Lowpass:**
```
b0 = (1 - cos_w0) / 2
b1 = 1 - cos_w0
b2 = (1 - cos_w0) / 2
a0 = 1 + alpha
a1 = -2 * cos_w0
a2 = 1 - alpha
```
(All coefficients divided by a0 for normalized form)

**Highpass:**
```
b0 = (1 + cos_w0) / 2
b1 = -(1 + cos_w0)
b2 = (1 + cos_w0) / 2
a0 = 1 + alpha
a1 = -2 * cos_w0
a2 = 1 - alpha
```

**Bandpass (constant 0 dB peak):**
```
b0 = sin_w0 / 2
b1 = 0
b2 = -sin_w0 / 2
a0 = 1 + alpha
a1 = -2 * cos_w0
a2 = 1 - alpha
```

**Notch (band-reject):**
```
b0 = 1
b1 = -2 * cos_w0
b2 = 1
a0 = 1 + alpha
a1 = -2 * cos_w0
a2 = 1 - alpha
```

**Peak EQ:**
```
A = sqrt(10^(dBgain/20)) = 10^(dBgain/40)
b0 = 1 + alpha * A
b1 = -2 * cos_w0
b2 = 1 - alpha * A
a0 = 1 + alpha / A
a1 = -2 * cos_w0
a2 = 1 - alpha / A
```

**Low shelf:**
```
b0 = A * [(A+1) - (A-1)*cos_w0 + 2*sqrt(A)*alpha]
b1 = 2*A * [(A-1) - (A+1)*cos_w0]
b2 = A * [(A+1) - (A-1)*cos_w0 - 2*sqrt(A)*alpha]
a0 = (A+1) + (A-1)*cos_w0 + 2*sqrt(A)*alpha
a1 = -2 * [(A-1) + (A+1)*cos_w0]
a2 = (A+1) + (A-1)*cos_w0 - 2*sqrt(A)*alpha
```

TypeScript implementation with coefficient update:

```typescript
interface BiquadCoeffs {
  b0: number; b1: number; b2: number;
  a1: number; a2: number;  // a0-normalized
}

class BiquadFilter {
  private x1 = 0; private x2 = 0;
  private y1 = 0; private y2 = 0;
  private coeffs: BiquadCoeffs = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };

  setLowpass(fc: number, Q: number, sampleRate: number): void {
    const w0 = (2 * Math.PI * fc) / sampleRate;
    const cosW0 = Math.cos(w0);
    const sinW0 = Math.sin(w0);
    const alpha = sinW0 / (2 * Q);
    const a0inv = 1 / (1 + alpha);
    this.coeffs = {
      b0: ((1 - cosW0) / 2) * a0inv,
      b1: (1 - cosW0) * a0inv,
      b2: ((1 - cosW0) / 2) * a0inv,
      a1: (-2 * cosW0) * a0inv,
      a2: (1 - alpha) * a0inv,
    };
  }

  process(x: number): number {
    const { b0, b1, b2, a1, a2 } = this.coeffs;
    const y = b0 * x + b1 * this.x1 + b2 * this.x2
                     - a1 * this.y1 - a2 * this.y2;
    this.x2 = this.x1; this.x1 = x;
    this.y2 = this.y1; this.y1 = y;
    return y;
  }
}
```

### 4.2.2 State-Variable Filter (SVF)

The SVF topology (Chamberlin, 1979) simultaneously computes lowpass, highpass, and bandpass outputs from a single two-integrator loop. This makes it ideal for morphable filter types.

Chamberlin SVF difference equations:

```
f1 = 2 * sin(pi * fc / Fs)   // frequency coefficient (small fc approximation valid below Fs/6)
q1 = 1 / Q

// Per sample:
LP = LP + f1 * BP
HP = input - LP - q1 * BP
BP = f1 * HP + BP
Notch = HP + LP
```

The Chamberlin SVF has a stability limit: f1 must remain below approximately 0.5 (fc < Fs/6). The Hal Chamberlin (1985) and later the Zavalishin (2012) topology resolve this instability using the Zero Delay Feedback (ZDF) formulation.

**ZDF State-Variable Filter (Zavalishin):**

```
g = tan(pi * fc / Fs)    // prewarped frequency
k = 1 / Q
a1_coeff = 1 / (1 + g * (g + k))
a2_coeff = g * a1_coeff
a3_coeff = g * a2_coeff

// Per sample (state variables ic1, ic2):
v3 = input - ic2
v1 = a1_coeff * ic1 + a2_coeff * v3
v2 = ic2 + a2_coeff * ic1 + a3_coeff * v3

ic1 = 2 * v1 - ic1
ic2 = 2 * v2 - ic2

HP = v3 - k * v1 - v2
BP = v1
LP = v2
Notch = HP + LP
AP = input - 2 * k * BP
```

This ZDF formulation is stable at any cutoff up to Nyquist and is the preferred topology for professional synthesizer filters.

### 4.2.3 Resonance and Self-Oscillation

In a 2-pole SVF or ladder filter, resonance (Q > 1/sqrt(2) for a biquad, Q > 0.5 for SVF) produces a peak at the cutoff frequency. As Q increases, the peak height increases: the -3 dB point coincides with fc for Q = 0.707 (Butterworth), peaking higher for Q > 0.707.

**Self-oscillation** occurs when the feedback gain equals unity, causing the filter to sustain a sinusoidal output at fc even with zero input. In a 4-pole Moog ladder, self-oscillation onset occurs at Q = 1/(4 * g * (1-g)^3) approximately. In practice, a dedicated "resonance" parameter is mapped nonlinearly so that maximum resonance approaches but does not exceed self-oscillation threshold, unless the designer explicitly wants self-oscillation as a feature.

### 4.2.4 Moog Ladder Filter

The Moog transistor ladder filter (Robert Moog, 1965) is a 4-pole (24 dB/octave) lowpass filter with feedback-controlled resonance. Its characteristic warm, nonlinear sound results from transistor saturation and feedback delay through the ladder stages.

The Huovilainen (2004) model provides a computationally tractable digital approximation:

```
// 4-stage ladder with nonlinear saturation (tanh per stage)
// State: y[0..3] (four stage outputs)
// thermal_v = 1/(2*VT), typically 1.22070313

per sample:
  input_tanh = tanh(input - 4 * resonance * y[3])
  y0_new = y[0] + f * (tanh(input_tanh) - tanh(y[0]))
  y1_new = y[1] + f * (tanh(y0_new) - tanh(y[1]))
  y2_new = y[2] + f * (tanh(y1_new) - tanh(y[2]))
  y3_new = y[3] + f * (tanh(y2_new) - tanh(y[3]))
  // where f = 2 * sin(pi * fc / Fs)
```

The Stilson & Smith (1996) model offers a linearized version that avoids tanh per sample (cheaper but less saturating character). The full nonlinear Huovilainen model is preferred for analog authenticity.

### 4.2.5 Korg MS-20 Filter

The MS-20 filter uses a Sallen-Key topology with diode-based nonlinear feedback. Its characteristic is a harsh, aggressive resonance that clips before self-oscillation. A simplified model:

```
// Two-pole Sallen-Key with nonlinear feedback
per sample:
  feedback = clip(y1, -1, 1) * resonance * 4
  s1 = s1 + f * (tanh(input - feedback) - s1)
  s2 = s2 + f * (s1 - s2)
  y1 = s2
  // where clip limits the feedback path
```

### 4.2.6 Web Audio API BiquadFilterNode vs Custom Filters

The native `BiquadFilterNode` offers types: `lowpass`, `highpass`, `bandpass`, `lowshelf`, `highshelf`, `peaking`, `notch`, `allpass`. AudioParam scheduling gives sample-accurate frequency sweeps.

**Limitations of BiquadFilterNode:**
- No self-oscillation
- No nonlinear saturation
- Fixed 12 dB/octave slope (2-pole only)
- No SVF simultaneous output access
- No per-sample coefficient modulation from JavaScript

For production synthesizer filter modulation, a custom AudioWorklet filter is required. The Web Audio BiquadFilterNode is suitable only for static or slowly-varying EQ applications.

---

## 4.3 Envelope Generators

### 4.3.1 ADSR Architecture

An ADSR envelope has four stages: Attack, Decay, Sustain, Release. State transitions:

```
IDLE -> ATTACK (on note-on)
ATTACK -> DECAY (when level reaches 1.0)
DECAY -> SUSTAIN (when level reaches sustain level)
SUSTAIN -> RELEASE (on note-off)
RELEASE -> IDLE (when level reaches ~0)
```

**Exponential segments** are perceptually superior to linear because the human ear perceives amplitude logarithmically. An exponential approach from current level to target:

```
// Per sample, exponential approach:
level += (target - level) * coeff
// where coeff = 1 - exp(-1 / (timeInSamples * curveFactor))
```

The `curveFactor` (typically 4-10) controls how "fast" the envelope approaches the target before slowing. A curveFactor of 0 gives linear; higher values give more exponential character.

```typescript
class ADSREnvelope {
  private level = 0;
  private stage: 'idle' | 'attack' | 'decay' | 'sustain' | 'release' = 'idle';

  // Time parameters in samples
  private attackCoeff = 0;
  private decayCoeff = 0;
  private releaseCoeff = 0;
  private sustainLevel = 0.7;

  configure(attackMs: number, decayMs: number, sustainLevel: number, releaseMs: number, sampleRate: number): void {
    const curve = 0.001; // shape factor
    this.attackCoeff = this.timeToCoeff(attackMs * sampleRate / 1000, curve);
    this.decayCoeff = this.timeToCoeff(decayMs * sampleRate / 1000, curve);
    this.releaseCoeff = this.timeToCoeff(releaseMs * sampleRate / 1000, curve);
    this.sustainLevel = sustainLevel;
  }

  private timeToCoeff(samples: number, curve: number): number {
    return 1 - Math.exp(-Math.log((1 + curve) / curve) / samples);
  }

  noteOn(): void { this.stage = 'attack'; }
  noteOff(): void { if (this.stage !== 'idle') this.stage = 'release'; }

  tick(): number {
    switch (this.stage) {
      case 'attack':
        this.level += this.attackCoeff * (1.0 + this.level * 0.3 - this.level);
        if (this.level >= 1.0) { this.level = 1.0; this.stage = 'decay'; }
        break;
      case 'decay':
        this.level += this.decayCoeff * (this.sustainLevel - this.level);
        break;
      case 'sustain':
        break;
      case 'release':
        this.level += this.releaseCoeff * (0.00001 - this.level);
        if (this.level <= 0.0001) { this.level = 0; this.stage = 'idle'; }
        break;
    }
    return this.level;
  }
}
```

### 4.3.2 Multi-Stage Envelopes

Multi-stage envelopes (DAHD, AHDSR, 8-stage DX7-style) generalize ADSR by allowing arbitrary sequences of (target, time, curve) segments. Implementation extends the state machine:

```typescript
interface EnvSegment {
  target: number;   // 0-1 level to reach
  timeMs: number;   // duration
  curve: number;    // 0 = linear, positive = exp approach
}

class MultiStageEnvelope {
  private segments: EnvSegment[] = [];
  private currentSeg = 0;
  private level = 0;
  private coeff = 0;

  setSegments(segs: EnvSegment[], sampleRate: number): void {
    this.segments = segs;
    // Precompute coefficients per segment omitted for brevity
  }

  tick(): number {
    if (this.currentSeg >= this.segments.length) return this.level;
    const seg = this.segments[this.currentSeg];
    this.level += this.coeff * (seg.target - this.level);
    if (Math.abs(this.level - seg.target) < 0.0001) {
      this.level = seg.target;
      this.currentSeg++;
      // Recompute coeff for next segment
    }
    return this.level;
  }
}
```

### 4.3.3 Modulation Targets

Envelope-to-pitch (vibrato-on-attack, hard sync pitch shapes), envelope-to-filter-cutoff (classic "wah" sweep), and envelope-to-amplifier (VCA) are the three canonical routing targets. The modulation matrix (section 4.5) formalizes this routing.

### 4.3.4 Re-trigger vs Legato

In re-trigger mode, a new note-on resets the envelope to zero (or to a minimum level) and begins the attack again. In legato mode, the envelope continues from its current level, preserving the decay/sustain position. This matters for smooth melodic lines:

```typescript
noteOn(legato: boolean): void {
  if (!legato || this.stage === 'idle') {
    this.level = 0;  // reset
  }
  this.stage = 'attack';
}
```

---

## 4.4 LFO (Low-Frequency Oscillator)

### 4.4.1 Architecture

An LFO is functionally identical to an audio oscillator but runs at sub-audio rates (typically 0.01 Hz to 30 Hz). It modulates parameters rather than producing audible output. All standard waveforms apply: sine (smooth vibrato/tremolo), triangle (linear sweep), sawtooth (rising or falling ramp), square (step modulation), S&H (stepped random).

```typescript
class LFO {
  private phase = 0;
  private sampleRate: number;
  rate = 1;        // Hz
  depth = 1;       // 0-1 multiplied by destination range
  shape: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'sample-hold' = 'sine';
  private holdValue = 0;
  private lastPhase = 0;

  tick(): number {
    const delta = this.rate / this.sampleRate;
    this.lastPhase = this.phase;
    this.phase = (this.phase + delta) % 1;

    let value: number;
    switch (this.shape) {
      case 'sine': value = Math.sin(2 * Math.PI * this.phase); break;
      case 'triangle': value = 4 * Math.abs(this.phase - 0.5) - 1; break;
      case 'sawtooth': value = 2 * this.phase - 1; break;
      case 'square': value = this.phase < 0.5 ? 1 : -1; break;
      case 'sample-hold':
        if (this.phase < this.lastPhase) this.holdValue = Math.random() * 2 - 1;
        value = this.holdValue; break;
    }
    return value * this.depth;
  }
}
```

### 4.4.2 Sync Modes

**Free running:** LFO runs independently, ignoring tempo and note events.

**Key sync:** Phase resets to 0 on each note-on event. This gives consistent timbral attack per note.

**Tempo sync:** LFO rate locks to a musically meaningful subdivision of the host tempo (1/4, 1/8, 1/16, dotted, triplet). Rate is computed from BPM:

```typescript
function tempoSyncedRateHz(bpm: number, subdivision: string): number {
  const beatDuration = 60 / bpm; // seconds per beat
  const subdivMap: Record<string, number> = {
    '1/1': 4, '1/2': 2, '1/4': 1, '1/8': 0.5,
    '1/16': 0.25, '1/32': 0.125,
    '1/4d': 1.5, '1/8d': 0.75,   // dotted
    '1/4t': 2/3, '1/8t': 1/3,    // triplet
  };
  return 1 / (beatDuration * (subdivMap[subdivision] ?? 1));
}
```

### 4.4.3 LFO Routing

LFO output is a modulation signal in [-1, 1] * depth. Routing to pitch adds cents offset; routing to filter cutoff adds Hz offset (or, better, a multiplier in semitones); routing to amplitude applies tremolo. The modulation matrix (section 4.5) handles all routing.

---

## 4.5 Modulation Architecture

### 4.5.1 The Modulation Matrix

A modulation matrix decouples signal sources from parameter destinations. Each matrix entry is a (source, amount, destination) triple:

```typescript
interface ModulationSlot {
  source: ModSource;   // enum: LFO1, LFO2, ENV1, ENV2, VELOCITY, AFTERTOUCH, MODWHEEL, PITCH_BEND
  amount: number;      // bipolar -1 to +1 (scaled by destination range)
  destination: ModDest; // enum: OSC1_PITCH, OSC1_FINE, FILTER_CUTOFF, FILTER_RESONANCE, VCA_LEVEL, ...
}
```

The modulation sum for a destination is:

```typescript
function computeModulation(dest: ModDest, slots: ModulationSlot[], sources: Map<ModSource, number>): number {
  return slots
    .filter(slot => slot.destination === dest)
    .reduce((sum, slot) => sum + slot.amount * (sources.get(slot.source) ?? 0), 0);
}
```

The base parameter value is then:

```typescript
const finalCutoff = baseCutoff + computeModulation(ModDest.FILTER_CUTOFF, slots, sourceValues) * cutoffRange;
```

### 4.5.2 Velocity and Aftertouch

Velocity (0-127 MIDI) maps to amplitude, filter cutoff, envelope attack time, and many other destinations. It is a per-note fixed value from note-on until note-off.

Aftertouch (channel pressure or per-note polyphonic pressure) is a real-time continuous signal. Per-note aftertouch enables expressive MPE (MIDI Polyphonic Expression) performance where each finger controls its own pitch bend, pressure, and slide independently.

```typescript
interface VoiceContext {
  velocity: number;       // 0-1 from MIDI velocity
  aftertouch: number;     // 0-1 from polyphonic pressure
  pitchBend: number;      // -1 to +1 semitones * pitchBendRange
  modWheel: number;       // 0-1 from CC1
}
```

### 4.5.3 Per-Voice vs Global Modulation

**Per-voice:** Velocity, per-note aftertouch, individual envelope outputs. Each voice carries its own copy of these values, allowing polyphonic expression.

**Global:** Master LFOs, tempo-sync, global pitch bend, mod wheel. Applied identically to all active voices. Some synthesizers provide both global LFOs (shared phase) and per-voice LFOs (each voice has its own LFO phase, sometimes randomized at note-on for "ensemble" character).

---

## 4.6 The TR-808 Drum Machine

### 4.6.1 Architecture Overview

The Roland TR-808 (1980) generates all drum sounds through analog synthesis -- no samples. Each instrument channel is a distinct analog circuit with fixed structure but voltage-controlled parameters (pitch, decay, accent). The step sequencer triggers these circuits.

**Key insight for emulation:** the 808's characteristic sounds arise from specific circuit behaviors -- exponential pitch envelopes, nonlinear transistor characteristics, bandpass filter resonances -- not from mere approximation. Faithful emulation requires circuit-level understanding.

### 4.6.2 Bass Drum (BD)

The 808 bass drum uses a bridged-T oscillator circuit that generates a sine-like tone, swept rapidly downward in pitch by an exponential envelope, fed through a VCA with a slower exponential decay.

**Signal flow:**
1. Triangle/sine oscillator at start pitch (~150 Hz typical)
2. Pitch envelope: exponential decay from start pitch to end pitch (e.g., 150 Hz -> 50 Hz over 30-100 ms)
3. VCA envelope: exponential decay controlling amplitude over 200-900 ms (the "decay" knob)
4. Slight click/transient at onset (from the circuit's fast initial impulse)

```typescript
class BassDrum808 {
  private phase = 0;
  private pitchEnv = 0;
  private ampEnv = 0;
  private pitchDecay = 0;
  private ampDecay = 0;

  trigger(decay: number, tone: number, sampleRate: number): void {
    this.phase = 0;
    this.pitchEnv = 1.0;
    this.ampEnv = 1.0;
    // Faster pitch decay, slower amp decay
    this.pitchDecay = Math.exp(-1 / (0.04 * sampleRate));    // ~40ms
    this.ampDecay = Math.exp(-1 / (decay * sampleRate));      // user-controlled
    this.startFreq = tone;
  }

  private startFreq = 150;
  private endFreq = 50;

  tick(): number {
    const freq = this.endFreq + (this.startFreq - this.endFreq) * this.pitchEnv;
    this.phase = (this.phase + freq / sampleRate) % 1;
    const osc = Math.sin(2 * Math.PI * this.phase);

    this.pitchEnv *= this.pitchDecay;
    this.ampEnv *= this.ampDecay;

    return osc * this.ampEnv;
  }
}
```

For added punch, a brief attack transient (a single-sample impulse or a very short noise burst through a highpass filter) is mixed in at trigger time.

### 4.6.3 Snare Drum (SD)

The 808 snare combines:
1. A tuned sine/triangle oscillator (~180 Hz) for the body "crack"
2. White noise through a bandpass filter for the "snappy" sound
3. A fast VCA on the tone component, a slower VCA on the noise component

```typescript
class Snare808 {
  private toneOsc: BridgedTOscillator;   // 180 Hz sine
  private noise: WhiteNoise;
  private noiseFilter: BiquadFilter;     // BPF ~1kHz, Q~1.5
  private toneEnv: ADSREnvelope;         // fast decay ~100ms
  private noiseEnv: ADSREnvelope;        // slightly slower ~150ms
  private snappyAmount = 0.5;            // mix ratio

  tick(): number {
    const tone = this.toneOsc.tick() * this.toneEnv.tick();
    const filtered = this.noiseFilter.process(this.noise.next());
    const snap = filtered * this.noiseEnv.tick();
    return tone * (1 - this.snappyAmount) + snap * this.snappyAmount;
  }
}
```

The "Snappy" knob on the physical 808 controls the mix between the noise component and the tonal component.

### 4.6.4 Hi-Hats (Open/Closed)

The 808 hi-hat generates a "metallic" sound by mixing six square wave oscillators at specific non-harmonically-related ratios (approximately: 1, 1.342, 1.563, 1.842, 2.127, 2.537 relative), creating a dense inharmonic spectrum typical of metal.

This mix is then fed through a bandpass/highpass filter (cutoff ~8-10 kHz) and a VCA.

The difference between closed hat (CH) and open hat (OH) is purely the envelope length: closed hat has a very short decay (~6-50 ms), open hat has a longer decay (~200 ms-1 s).

```typescript
const HAT_RATIOS = [1.000, 1.342, 1.563, 1.842, 2.127, 2.537];
const BASE_FREQ = 400; // Hz, the base frequency for the oscillator bank

class HiHat808 {
  private phases = new Float64Array(6);
  private envLevel = 0;
  private envDecay = 0;
  private hpf: BiquadFilter;

  trigger(isOpen: boolean, sampleRate: number): void {
    this.envLevel = 1.0;
    const decayTime = isOpen ? 0.5 : 0.04; // seconds
    this.envDecay = Math.exp(-1 / (decayTime * sampleRate));
    // Re-trigger: phases do NOT reset (authentic 808 behavior: open hat cuts off closed hat)
  }

  tick(sampleRate: number): number {
    let sum = 0;
    for (let i = 0; i < 6; i++) {
      const freq = BASE_FREQ * HAT_RATIOS[i];
      this.phases[i] = (this.phases[i] + freq / sampleRate) % 1;
      sum += this.phases[i] < 0.5 ? 1 : -1; // square wave
    }
    const filtered = this.hpf.process(sum / 6);
    this.envLevel *= this.envDecay;
    return filtered * this.envLevel;
  }
}
```

**Mutual exclusivity:** In the authentic 808, triggering CH while OH is sustaining cuts off the OH envelope immediately (uses the same physical circuit). This is implemented by sharing a single `envLevel` state between both hat instances.

### 4.6.5 Clap (CP)

The 808 clap uses white noise fed through a bandpass filter, triggered with four rapid bursts in quick succession (approximately 0, 8, 16, and 24 ms apart) to simulate the acoustic scatter of multiple hands clapping. The final burst has the longest decay.

```typescript
class Clap808 {
  private delays = [0, 0.008, 0.016, 0.024]; // seconds
  private envs: ADSREnvelope[];
  private noise: WhiteNoise;
  private bpf: BiquadFilter; // ~1kHz, Q~1

  trigger(decay: number, sampleRate: number): void {
    // Schedule each of the four bursts
    // Implement via offset sample counters
  }

  tick(): number {
    const n = this.noise.next();
    const filtered = this.bpf.process(n);
    // Sum contributions from all four bursts based on their timing
    return filtered * this.getCurrentEnvSum();
  }
}
```

### 4.6.6 Additional Instruments

**Cowbell (CB):** Two square wave oscillators at 540 Hz and 800 Hz, summed and passed through a bandpass filter with a short metallic decay. Accent adds a brief additional amplitude boost at onset.

**Rimshot (RS):** A combination of a very brief (~5 ms) noise burst and a short sine tone (~100 Hz), plus high-frequency click at onset. The characteristic "stick hitting rim" sound.

**Clave (CL):** A sharp, high-Q bandpass-filtered noise click at approximately 2500 Hz with an extremely fast decay (5-10 ms).

**Maracas (MA):** White noise through a highpass filter (~5 kHz) with a very short envelope (~20 ms), producing the dry, papery rattle sound.

**Cowbell and toms (LT, MT, HT):** Tom voices use similar architecture to the bass drum -- a pitch-enveloped sine oscillator -- with higher start frequencies and shorter decays corresponding to low (LT), mid (MT), and high (HT) tom pitches.

### 4.6.7 Step Sequencer

The TR-808 step sequencer runs 16 steps per pattern at a fixed tempo, with each step either active or inactive per voice. Two patterns (A and B) can be stored and chained.

```typescript
interface TR808Pattern {
  steps: boolean[][];  // [voice][step], 16 steps per voice
  accent: boolean[];   // per-step accent flag
  tempo: number;       // BPM
  swing: number;       // 0-1, amount of swing (delays even-numbered steps)
}

class StepSequencer {
  private step = 0;
  private samplesSinceStep = 0;

  tick(pattern: TR808Pattern, sampleRate: number, drums: Map<string, DrumVoice>): void {
    const stepDuration = 60 / pattern.tempo / 4; // 1/16th note in seconds
    // Swing: even steps are delayed by swing amount
    const swingOffset = (this.step % 2 === 1) ? pattern.swing * stepDuration * 0.5 : 0;
    const currentStepDuration = stepDuration + swingOffset;
    const samplesPerStep = currentStepDuration * sampleRate;

    if (this.samplesSinceStep >= samplesPerStep) {
      this.samplesSinceStep -= samplesPerStep;
      // Trigger active drums for this step
      for (const [name, drum] of drums) {
        const voiceIdx = drumVoiceIndex(name);
        if (pattern.steps[voiceIdx][this.step]) {
          drum.trigger(pattern.accent[this.step]);
        }
      }
      this.step = (this.step + 1) % 16;
    }
    this.samplesSinceStep++;
  }
}
```

### 4.6.8 Web Audio API Implementation Strategy

For the TR-808 emulation in a browser:

1. **AudioWorkletProcessor per voice:** Each drum sound runs in its own AudioWorkletProcessor. The worklet-main-thread communication sends trigger messages via MessagePort with a scheduled `startTime` for sample-accurate triggering.

2. **Sample-accurate triggering:** Use `audioCtx.currentTime + lookahead` for scheduling, where lookahead is typically 100 ms. This prevents early-quantum triggering artifacts.

3. **Accent implementation:** The accent signal boosts the amplitude by approximately +6 dB and slightly increases decay time. Pass an `accent` flag in the trigger message.

4. **Swing implementation:** Compute even-step delay in the scheduler, adding the swing offset to the scheduled AudioContext time.

---

## 4.7 Arpeggiator Patterns

### 4.7.1 Core Patterns

An arpeggiator takes a set of held notes and plays them in sequence, one at a time, at a rhythmic rate. The pattern determines the order:

```typescript
type ArpPattern = 'up' | 'down' | 'up-down' | 'up-down-exclusive' | 'random' | 'as-played';

function buildArpSequence(notes: number[], pattern: ArpPattern, octaves: number): number[] {
  const sorted = [...notes].sort((a, b) => a - b);
  let sequence: number[] = [];

  // Expand across octaves
  for (let oct = 0; oct < octaves; oct++) {
    sequence.push(...sorted.map(n => n + oct * 12));
  }

  switch (pattern) {
    case 'up': return sequence;
    case 'down': return [...sequence].reverse();
    case 'up-down':
      return [...sequence, ...([...sequence].reverse())];
    case 'up-down-exclusive':
      // Don't repeat top and bottom notes
      return [...sequence, ...([...sequence].slice(1, -1).reverse())];
    case 'random':
      return shuffleArray(sequence);
    case 'as-played':
      // Use insertion order from notes array (not sorted)
      return [...notes, ...notes.map(n => n + 12)].slice(0, octaves * notes.length);
  }
}
```

### 4.7.2 Rate, Gate, and Swing

**Rate:** Typically synced to host tempo. Common rates: 1/4, 1/8, 1/16, 1/32 notes; dotted and triplet variants.

**Gate:** The proportion of the step time the note is held: 0% = immediate off (staccato), 100% = held until next note. Values between 50-70% give a typical arpeggio feel.

**Swing:** Even steps are slightly delayed (as in the step sequencer above), creating a triplet-like groove.

### 4.7.3 Latch Mode

In latch mode, held notes are frozen into the arpeggio sequence even after the keys are released. Pressing new keys while latched either replaces the sequence or adds to it (implementation-specific). A `latch` boolean flag controls whether the note buffer is cleared on all-notes-off.

### 4.7.4 Note Length / Legato Arp

When gate = 100% and legato mode is active on the synthesizer, consecutive arpeggio notes are connected smoothly (legato retrigger in the envelope generator). This creates a smooth, connected arpeggio texture versus a staccato plucked one.

---

## 4.8 Polyphony Management

### 4.8.1 Voice Allocation Algorithms

A polyphonic synthesizer maintains a pool of N voice objects. On each note-on, a voice is assigned to play the new note. On note-off, the voice transitions to release phase and eventually becomes available again.

```typescript
interface Voice {
  noteNumber: number | null;  // currently playing note, null = idle
  isActive: boolean;          // true while in any stage but idle
  startTime: number;          // AudioContext time when voice was started
  priority: number;           // for LRU / priority-based stealing
}
```

**Round-robin:** Assign note-ons to voices in cyclic order (0, 1, 2, ..., N-1, 0, ...). Simple but may steal a recently started note.

**Oldest note stealing:** When all voices are active, steal the voice that has been playing the longest. This is the most common strategy for melodic synthesizers.

**Lowest priority stealing:** Assign priorities based on musical context (e.g., bass notes have lower priority than melody notes). Steal the lowest-priority voice. Rarely implemented in practice.

**Same-note priority:** If a new note-on has the same MIDI note number as an active voice, reuse that voice (retrigger). This prevents "stuck notes" in legato playing.

```typescript
function allocateVoice(voices: Voice[], newNote: number, currentTime: number): Voice {
  // 1. Find idle voice
  const idle = voices.find(v => !v.isActive);
  if (idle) return idle;

  // 2. Find voice playing the same note (retrigger)
  const sameNote = voices.find(v => v.noteNumber === newNote);
  if (sameNote) return sameNote;

  // 3. Steal oldest voice
  return voices.reduce((oldest, v) => v.startTime < oldest.startTime ? v : oldest, voices[0]);
}
```

### 4.8.2 Monophonic Modes

**Monophonic / mono mode:** Only one voice plays at a time. On new note-on, the current voice is either retriggered (the existing envelope resets) or plays legato (envelope continues, only pitch changes).

**Last-note priority:** The most recently pressed key takes priority; releasing it falls back to the previously held key (if still held). This enables natural monophonic lead playing.

```typescript
class MonoNoteStack {
  private stack: number[] = [];

  noteOn(note: number): { note: number; legato: boolean } {
    const legato = this.stack.length > 0;
    this.stack.push(note);
    return { note, legato };
  }

  noteOff(note: number): { note: number | null; legato: boolean } {
    this.stack = this.stack.filter(n => n !== note);
    if (this.stack.length > 0) {
      return { note: this.stack[this.stack.length - 1], legato: true };
    }
    return { note: null, legato: false };
  }
}
```

### 4.8.3 CPU Budget and Voice Count

Each AudioWorklet voice processes 128 samples per quantum. At 48 kHz, one quantum is 128/48000 = 2.67 ms. The audio thread must complete all processing before the next quantum. In practice:
- A simple oscillator + filter + envelope voice costs approximately 0.05-0.2 ms per voice on modern hardware.
- Complex voices (multiple oscillators, unison, effects sends) may cost 0.5-2 ms per voice.
- With N = 8 voices and a safety margin, total processing budget is approximately 1 ms per quantum.

Voice count is thus bounded by CPU at approximately 8-32 voices for complex synthesizers in a browser context, and 64+ for simple voices.

### 4.8.4 Voice Pooling in AudioWorklet

Rather than creating/destroying AudioWorklet nodes dynamically (expensive), voice pools pre-allocate a fixed number of processor instances and idle them:

```typescript
// Main thread: preallocate N voice nodes
const voicePool: AudioWorkletNode[] = [];
for (let i = 0; i < MAX_VOICES; i++) {
  const node = new AudioWorkletNode(audioCtx, 'synth-voice-processor');
  node.connect(masterBus);
  voicePool.push(node);
}

// On note-on: send 'noteOn' message to selected voice node
function triggerVoice(voiceIdx: number, note: number, velocity: number): void {
  voicePool[voiceIdx].port.postMessage({ type: 'noteOn', note, velocity });
}
```

The AudioWorklet processor handles note-on by starting its envelope; it handles note-off by starting release. The processor outputs silence (returns a zero buffer) when idle, which the Web Audio API can optimize with "connected graph trimming" in some implementations.

---

## 4.9 Preset System

### 4.9.1 Parameter Serialization

A preset is a complete serialization of all synthesizer parameters. A flat JSON object is the simplest and most interoperable format:

```typescript
interface SynthPreset {
  id: string;
  name: string;
  category: string;
  tags: string[];
  version: number;           // schema version for migration
  author?: string;
  createdAt: string;         // ISO 8601
  parameters: Record<string, number | string | boolean>;
  modulationMatrix: ModulationSlot[];
}
```

Example parameter keys follow a namespaced dot-notation convention:
```
osc1.waveform = "sawtooth"
osc1.detune = 0.0
osc1.octave = 0
filter.type = "lowpass"
filter.cutoff = 800.0
filter.resonance = 0.3
filter.envAmount = 0.5
env1.attack = 10.0      // ms
env1.decay = 200.0      // ms
env1.sustain = 0.7
env1.release = 300.0    // ms
lfo1.rate = 5.0         // Hz
lfo1.depth = 0.3
lfo1.shape = "sine"
```

### 4.9.2 Factory vs User Presets

Factory presets are bundled with the application and are read-only. User presets are mutable and stored in IndexedDB (browser) or a backend database. A clean separation:

```typescript
type PresetSource = 'factory' | 'user';

interface PresetStore {
  loadPreset(id: string, source: PresetSource): Promise<SynthPreset>;
  savePreset(preset: SynthPreset): Promise<void>;   // only user
  listPresets(category?: string, tags?: string[]): Promise<PresetMeta[]>;
  deletePreset(id: string): Promise<void>;           // only user
}
```

Preset export/import uses JSON files, enabling sharing between users. A version field in the preset schema allows forward-compatible migration when parameter names or ranges change.

### 4.9.3 Preset Categories and Tagging

Standard synthesizer preset categories (borrowed from hardware convention):
- Bass, Lead, Pad, Arpeggio, Sequence, Keys, Organ, Brass, Strings, Percussion, FX, Template

Tags add freeform metadata: `[warm, dark, modular, vintage, aggressive, ambient, ...]`

### 4.9.4 Preset Morphing

Morphing interpolates all numeric parameters between two presets A and B:

```typescript
function morphPresets(presetA: SynthPreset, presetB: SynthPreset, t: number): SynthPreset {
  const morphed = { ...presetA, parameters: {} };
  for (const key of Object.keys(presetA.parameters)) {
    const a = presetA.parameters[key];
    const b = presetB.parameters[key];
    if (typeof a === 'number' && typeof b === 'number') {
      morphed.parameters[key] = a + (b - a) * t;
    } else {
      // Non-numeric: switch at t = 0.5
      morphed.parameters[key] = t < 0.5 ? a : b;
    }
  }
  return morphed;
}
```

**Limitations of linear morphing:** Parameters on logarithmic scales (frequency, amplitude) should be interpolated in log space:

```typescript
function logMorph(a: number, b: number, t: number): number {
  return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);
}
```

---

## 4.10 Effects Processing

### 4.10.1 Reverb: Convolution vs Algorithmic

**Convolution reverb** (impulse response convolution) captures the acoustic character of real spaces. An impulse response (IR) is recorded by firing a starter pistol or sweeping a sine in a space, capturing the room's response. Convolution with this IR applies the exact room acoustics to any audio signal.

Web Audio API's `ConvolverNode` implements FFT-based overlap-add convolution efficiently:

```typescript
async function loadIR(audioCtx: AudioContext, irUrl: string): Promise<ConvolverNode> {
  const response = await fetch(irUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const convolver = audioCtx.createConvolver();
  convolver.buffer = audioBuffer;
  return convolver;
}
```

**Algorithmic reverb** synthesizes reverberation from a network of delay lines, comb filters, and allpass filters. The Schroeder (1962) model uses parallel comb filters (for density) followed by series allpass filters (for diffusion):

```
// Freeverb (Jezar at Dreampoint, 1997) -- 8 comb + 4 allpass per channel
// Comb filter:
y[n] = x[n-delay] + g * y[n-delay] + (1-g) * damping * x[n-delay]

// Allpass filter:
y[n] = -g * x[n] + x[n-delay] + g * y[n-delay]
```

Freeverb parameters: `roomSize` (0-1 maps comb filter gains), `damping` (high-frequency absorption), `wet` (reverb level), `width` (stereo spread).

**Trade-offs:**

| Feature            | Convolution        | Algorithmic (Freeverb) |
|-------------------|--------------------|------------------------|
| Realism           | High (authentic)   | Medium (synthetic)     |
| CPU cost          | High (FFT per block)| Low                   |
| Memory            | High (IR buffer)   | Minimal                |
| Adjustability     | Limited (EQ only)  | Full parameter control |
| Latency           | Block-size (ConvolverNode) | Sample-accurate |

### 4.10.2 Delay

**Simple delay:** A circular buffer of audio samples. Output is the sample at position `(writePos - delayInSamples)`.

```typescript
class DelayLine {
  private buffer: Float32Array;
  private writePos = 0;

  constructor(maxDelaySeconds: number, sampleRate: number) {
    this.buffer = new Float32Array(Math.ceil(maxDelaySeconds * sampleRate));
  }

  process(input: number, delayInSamples: number, feedback: number): number {
    const readPos = (this.writePos - delayInSamples + this.buffer.length) % this.buffer.length;
    const output = this.buffer[readPos];
    this.buffer[this.writePos] = input + output * feedback;
    this.writePos = (this.writePos + 1) % this.buffer.length;
    return output;
  }
}
```

**Ping-pong delay:** Two delay lines (left/right channels) where the left output feeds the right input and vice versa, creating a bouncing stereo delay effect.

**Tape delay:** A modulated delay line where the delay time changes slowly (simulating tape speed variation), plus a lowpass filter in the feedback loop (simulating tape bandwidth limitation), plus a saturation stage (simulating tape saturation).

### 4.10.3 Distortion and Waveshaping

Distortion is implemented as a nonlinear waveshaping function applied sample-by-sample:

```typescript
type WaveshapeFn = (x: number) => number;

// Soft clipping (tanh saturation)
const softClip: WaveshapeFn = (x) => Math.tanh(x * drive) / Math.tanh(drive);

// Hard clipping
const hardClip: WaveshapeFn = (x) => Math.max(-1, Math.min(1, x * drive));

// Asymmetric soft clip (tube-like even harmonics)
const tubeSat: WaveshapeFn = (x) => {
  if (x >= 0) return 1 - Math.exp(-x);
  return -1 + Math.exp(x * 0.5);  // softer on negative side
};

// Precompute lookup table for real-time use (avoid Math.tanh per sample)
function makeWaveshapeTable(fn: WaveshapeFn, tableSize = 4096): Float32Array {
  const table = new Float32Array(tableSize);
  for (let i = 0; i < tableSize; i++) {
    const x = (i / tableSize) * 2 - 1;
    table[i] = fn(x);
  }
  return table;
}
```

**Oversampling for distortion:** Waveshaping generates harmonics above Nyquist. For high-quality distortion, upsample the signal 2x-8x before waveshaping, then downsample with a steep lowpass filter. Web Audio API does not provide native oversampling for custom processors; it must be implemented manually in the AudioWorklet or via the WaveShaper node's `oversample` property (`'none'`, `'2x'`, `'4x'`).

The native `WaveShaperNode` accepts a Float32Array curve and applies it with optional oversampling -- suitable for moderate distortion needs without custom AudioWorklet code.

### 4.10.4 Chorus, Flanger, Phaser

All three are modulated delay effects:

**Chorus:** A short modulated delay (10-30 ms) mixed with the dry signal. The modulation (LFO at 0.1-5 Hz) creates pitch variation, thickening the sound. Multiple delay taps with different LFO phases give a wider, richer chorus.

**Flanger:** An extremely short modulated delay (0.5-10 ms) with feedback, creating a comb-filter sweep. The LFO sweep moves the comb filter notches up and down.

**Phaser:** An allpass filter bank whose center frequencies are modulated by an LFO. Instead of delay, it creates phase shifts at specific frequencies, and when mixed with dry signal, produces comb-filter-like cancellations that sweep in pitch.

```typescript
// All-pass filter for phaser
class AllpassFilter {
  private state = 0;

  process(input: number, coeff: number): number {
    // First-order allpass: output = -g*input + x[n-1] + g*y[n-1]
    const output = coeff * (input - this.state) + this.state;
    this.state = input;
    return output;
  }
}

class Phaser {
  private stages: AllpassFilter[] = Array.from({ length: 4 }, () => new AllpassFilter());
  private lfo: LFO;

  tick(input: number): number {
    const lfoValue = this.lfo.tick();
    // Map LFO to allpass coefficient range
    const coeff = lfoToCoeff(lfoValue);
    let x = input;
    for (const stage of this.stages) {
      x = stage.process(x, coeff);
    }
    return (input + x) * 0.5; // mix dry + processed
  }
}
```

### 4.10.5 Compressor/Limiter

**DynamicsCompressorNode** provides an efficient native compressor with parameters: `threshold`, `knee`, `ratio`, `attack`, `release`, `reduction`. Suitable for bus compression and final limiter.

**Custom compressor** in AudioWorklet allows sidechain, lookahead, and per-sample gain computation:

```typescript
// Sidechain compressor (simplified)
class Compressor {
  private envelope = 0;
  private threshold: number;   // linear
  private ratio: number;
  private attackCoeff: number;
  private releaseCoeff: number;

  tick(input: number, sidechain: number): number {
    // Level detection (RMS or peak)
    const level = Math.abs(sidechain);

    // Envelope follower
    const coeff = level > this.envelope ? this.attackCoeff : this.releaseCoeff;
    this.envelope = this.envelope + coeff * (level - this.envelope);

    // Gain computation
    let gainDb = 0;
    if (this.envelope > this.threshold) {
      gainDb = (this.threshold - this.envelope) * (1 - 1 / this.ratio);
    }
    const gainLinear = Math.pow(10, gainDb / 20);
    return input * gainLinear;
  }
}
```

**Lookahead limiter:** Delays the audio signal by L samples (lookahead time), while computing the gain reduction from the undelayed signal. This allows the limiter to react to peaks before they arrive, preventing any overshoots.

### 4.10.6 EQ

**Parametric EQ** applies a cascade of biquad filters (each targeting a specific frequency band):

```typescript
class ParametricEQ {
  private bands: BiquadFilter[];

  constructor(bandCount: number) {
    this.bands = Array.from({ length: bandCount }, () => new BiquadFilter());
    // Band 0: low shelf, band N-1: high shelf, middle: peak EQ
  }

  setBand(index: number, freq: number, gain: number, Q: number, sampleRate: number): void {
    const band = this.bands[index];
    if (index === 0) band.setLowShelf(freq, gain, sampleRate);
    else if (index === this.bands.length - 1) band.setHighShelf(freq, gain, sampleRate);
    else band.setPeak(freq, gain, Q, sampleRate);
  }

  process(input: number): number {
    return this.bands.reduce((x, band) => band.process(x), input);
  }
}
```

**Graphic EQ** uses a fixed set of center frequencies (typically ISO octave or 1/3-octave) with individual boost/cut controls. Each band is a peak filter with fixed Q (approximately 1.41 for octave spacing, 4.32 for 1/3-octave spacing).

---

## 5. Comparative Synthesis

### 5.1 Oscillator Algorithm Comparison

| Algorithm     | Aliasing | CPU/voice | Memory | Pitch flexibility | Complexity |
|--------------|----------|-----------|--------|-------------------|------------|
| Naive        | Severe   | ~1 ns     | None   | Any              | Trivial    |
| PolyBLEP     | Good     | ~5 ns     | None   | Any              | Low        |
| MinBLEP      | Excellent| ~20 ns    | 1-4 KB | Any             | Medium     |
| Additive     | None     | O(K) sines| None   | Any              | Medium     |
| Wavetable    | Good*    | ~10 ns    | 100 KB+| Limited by table | Low-Med    |

*Quality depends on mipmap table design.

### 5.2 Filter Topology Comparison

| Topology          | Slope      | Self-osc | Nonlinear | Stability | Web Audio native |
|------------------|-----------|---------|-----------|----------|-----------------|
| Biquad (RBJ)     | 12 dB/oct | No      | No        | Always   | Yes (BiquadFilterNode) |
| 4-pole cascade   | 24 dB/oct | No      | No        | Always   | No (custom)     |
| Chamberlin SVF   | 12 dB/oct | Yes     | No        | fc<Fs/6  | No              |
| ZDF SVF          | 12 dB/oct | Yes     | No        | Always   | No              |
| Moog Ladder (HL) | 24 dB/oct | Yes     | Yes (tanh)| Always   | No              |
| MS-20 (SK)       | 12 dB/oct | Yes     | Yes (clip)| Always   | No              |

### 5.3 Reverb Approach Comparison

| Approach         | CPU  | Memory | Realism | Control | Latency       |
|-----------------|------|--------|---------|---------|---------------|
| ConvolverNode   | High | High   | High    | Limited | Block-size    |
| Freeverb        | Low  | Low    | Medium  | Full    | Zero          |
| FDN (Feedback Delay Network) | Medium | Low | High | Full | Zero |

### 5.4 Polyphony Model Comparison

| Model          | Max voices | CPU overhead | Expressiveness |
|---------------|-----------|-------------|----------------|
| Monophonic    | 1         | Minimal     | Legato/slides  |
| Paraphonic    | N (shared filter) | Low | Limited       |
| True polyphonic| N (full stack per voice) | High | Full         |
| MPE polyphonic | N (per-voice mod) | High | Maximum      |

---

## 6. Open Problems and Gaps

### 6.1 AudioWorklet WASM Sharing

AudioWorklet processors can instantiate WebAssembly modules, but sharing a single WASM instance across multiple AudioWorkletNode instances is not standardized. Each node may instantiate its own WASM module, multiplying memory overhead. Work is ongoing in the W3C Web Audio WG on shared WASM memory for audio, but no specification has been finalized as of early 2026.

### 6.2 AudioParam Scheduling Precision

In current browser implementations, `AudioParam.setValueAtTime()` and related scheduling methods have a quantization floor equal to one render quantum (128 samples = ~2.67 ms at 48 kHz). This limits the temporal precision of automated parameter changes. Workarounds include custom AudioWorklet envelope generators that operate at the sample level, bypassing the AudioParam scheduling API entirely for high-precision envelopes.

### 6.3 Cross-Browser Render Quantum

The Web Audio API specification mandates a render quantum of 128 samples, but implementations have historically varied. Safari in particular had a non-standard render quantum in earlier versions. While current browsers have converged on 128, this represents a hard lower bound on latency (~2.67 ms) and a coarse-grained AudioParam scheduling resolution.

### 6.4 Oversampling for Nonlinear Processing

No Web Audio API mechanism provides native oversampling for custom AudioWorklet DSP. The `WaveShaperNode.oversample` property is the only native oversampling, limited to 2x and 4x. For high-quality analog emulation requiring 8x or 16x oversampling (Moog-style saturation), the developer must implement a complete polyphase resampler in JavaScript/WASM within the AudioWorklet, at significant CPU cost.

### 6.5 SIMD in AudioWorklet

WebAssembly SIMD (128-bit SIMD via wasm-simd) is available in AudioWorklet contexts, enabling 4x throughput for 32-bit floating-point DSP. However, JavaScript within AudioWorklet cannot access SIMD intrinsics directly -- all SIMD optimization requires WASM. This creates a development friction: high-performance synthesizer DSP must be written in C/C++/Rust and compiled to WASM, while parameter control and scheduling logic remains in JavaScript.

### 6.6 Phase Continuity in Voice Stealing

When a voice is stolen for a new note, the oscillator phase may be at an arbitrary position. This causes a discontinuity (click) unless the new oscillator is phase-reset to zero (another minor click unless crossfaded) or the transition is fade-gated. No standard solution exists; implementations vary between "hard steal" (click risk), "fade steal" (brief amplitude ramp), and "phase-match steal" (match the stolen voice's phase at handoff).

---

## 7. Conclusion

Browser-based synthesis in 2026 is technically capable of matching the quality of desktop software synthesizers, contingent on using AudioWorklet for all performance-critical DSP rather than the high-level native nodes. The principal architectural decisions reduce to three:

**Oscillator strategy:** PolyBLEP provides a pragmatic balance of quality and simplicity for most waveforms; wavetable synthesis provides the highest flexibility for complex timbres; additive synthesis is reserved for scenarios where spectral precision is paramount.

**Filter strategy:** ZDF state-variable filters provide stable, alias-free frequency sweeping for general synthesis; the Moog ladder model provides the specific nonlinear warmth that defines analog synthesis character; native BiquadFilterNode is appropriate only for EQ and static spectral shaping.

**Modulation architecture:** A clean source-amount-destination matrix, evaluated once per audio block with all modulation sources computed at the start of each block, provides the most maintainable and extensible modulation routing without per-sample branching overhead.

The TR-808 case study demonstrates that analog drum synthesis emulation is achievable with a small number of oscillators, noise generators, and filters per voice -- the complexity lies in the accurate modeling of circuit-specific behaviors (exponential pitch envelopes, specific inharmonic oscillator ratios, mutual-exclusivity of hi-hat circuits) rather than in computational power.

Open problems remain in oversampling quality for nonlinear processing, WASM sharing across voice pools, and sub-quantum AudioParam scheduling precision. These are areas of active W3C specification work and browser vendor development.

---

## References

1. Bristow-Johnson, R. (1994). *Cookbook formulae for audio EQ biquad filter coefficients*. https://webaudio.github.io/Audio-EQ-Cookbook/Audio-EQ-Cookbook.txt

2. Chamberlin, H. (1985). *Musical Applications of Microprocessors* (2nd ed.). Hayden Books. ISBN 0-8104-5Arrow

3. Huovilainen, A. (2004). Non-linear digital implementation of the Moog ladder filter. *Proc. Int. Conf. Digital Audio Effects (DAFx-04)*, Naples, Italy. https://dafx.de/paper-archive/2004/P_061.pdf

4. Moog, R. A. (1965). *Voltage-controlled electronic music modules*. Journal of the Audio Engineering Society, 13(2), 101-106.

5. Puckette, M. (2007). *The Theory and Technique of Electronic Music*. World Scientific Press. https://msp.ucsd.edu/techniques.htm

6. Roads, C. (1996). *The Computer Music Tutorial*. MIT Press. ISBN 0-262-68082-3

7. Schroeder, M. R. (1962). Natural sounding artificial reverberation. *Journal of the Audio Engineering Society*, 10(3), 219-223.

8. Smith, J. O. III (2007). *Introduction to Digital Filters with Audio Applications*. W3K Publishing. https://ccrma.stanford.edu/~jos/filters/

9. Smith, J. O. III (2010). *Physical Audio Signal Processing*. W3K Publishing. https://ccrma.stanford.edu/~jos/pasp/

10. Stilson, T. & Smith, J. O. III (1996). Analyzing the Moog VCF with considerations for digital implementation. *Proc. ICMC*, Hong Kong. https://ccrma.stanford.edu/~stilti/papers/moogvcf.pdf

11. Valimaki, V. & Huovilainen, A. (2006). Oscillator and filter algorithms for virtual analog synthesis. *Computer Music Journal*, 30(2), 19-31. MIT Press.

12. Voss, R. F. & Clarke, J. (1978). 1/f noise in music: Music from 1/f noise. *Journal of the Acoustical Society of America*, 63(1), 258-263.

13. W3C Web Audio Working Group (2021). *Web Audio API*. W3C Recommendation. https://www.w3.org/TR/webaudio/

14. Zavalishin, V. (2012). *The Art of VA Filter Design*. Native Instruments GmbH. https://www.native-instruments.com/fileadmin/ni_media/downloads/pdf/VAFilterDesign_2.1.0.pdf

15. Jezar at Dreampoint (1997). *Freeverb* -- public domain C++ implementation. http://www.dreampoint.co.uk/

16. Roland Corporation (1980). *TR-808 Rhythm Composer Service Manual*. Roland Corporation.

17. Parker, J. D. (2013). Efficient dispersion generation structures for spring reverb emulation. *EURASIP Journal on Advances in Signal Processing*, 2013(1), 1-15.

18. Kleimola, J. & Valimaki, V. (2007). Audio signal processing using the Phase Distortion synthesis method. *Proc. Int. Conf. Digital Audio Effects (DAFx-07)*. https://dafx.de/paper-archive/2007/

19. Brandt, E. (2001). Hard sync without aliasing. *Proc. ICMC 2001*, Havana, Cuba. (MinBLEP reference)

20. Esqueda, F., Valimaki, V., & Bilbao, S. (2016). Aliasing reduction in clipped signals. *IEEE Transactions on Signal Processing*, 64(20), 5255-5267.

---

## Practitioner Resources

### Web Audio API and AudioWorklet

- **W3C Web Audio API spec**: https://www.w3.org/TR/webaudio/ -- authoritative source for AudioWorklet, AudioParam, AudioNode graph behavior
- **MDN Web Docs -- Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API -- practical guides and browser compatibility tables
- **Google Chrome Web Audio Examples**: https://googlechromelabs.github.io/web-audio-samples/ -- AudioWorklet examples, polyphony demos

### DSP Reference

- **JOS Signal Processing**: https://ccrma.stanford.edu/~jos/ -- Julius O. Smith III's complete online DSP textbooks, open access
- **Audio EQ Cookbook**: https://webaudio.github.io/Audio-EQ-Cookbook/ -- RBJ biquad design equations in copy-paste format
- **Zavalishin VA Filter Design PDF**: https://www.native-instruments.com/fileadmin/ni_media/downloads/pdf/VAFilterDesign_2.1.0.pdf -- comprehensive analog-to-digital filter modeling

### Open Source Synthesizers (Reference Implementations)

- **Tone.js**: https://tonejs.github.io/ -- high-level Web Audio API synthesis framework, TypeScript, MIT
- **WebSynth (various)**: https://github.com/ameobea/web-synth -- browser DAW with AudioWorklet synth
- **Elementary Audio**: https://www.elementary.audio/ -- functional DSP graph for browser and native, WASM-first
- **SOUL (ROLI)**: https://soul.dev/ -- ahead-of-time DSP language compiling to WASM/AudioWorklet
- **JUCE**: https://juce.com/ -- C++ audio framework with WASM/WebAssembly compilation target via Emscripten

### TR-808 Resources

- **808 Service Manual**: Available via Internet Archive -- circuit diagrams for all drum voices
- **DrumSynth 808**: https://github.com/HelmaHubers/drum808 -- open source 808 emulation (older, reference)
- **Analog Drums Deep Dive** (Ken Stone): https://www.cgs.synth.net/ -- transistor circuit analysis for analog drums

### Wavetable and PolyBLEP

- **Martin Finke's PolyBLEP tutorial**: https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/ -- step-by-step PolyBLEP implementation
- **PolyBLEP2 (2nd order)**: https://dafx.de/paper-archive/2012/dafx12_submission_93.pdf -- improved correction
- **WaveEdit** (wavetable editor): https://synthtech.com/waveedit -- open source wavetable creation tool

### Filter Design Tools

- **Filter Design Tool (biquad coefficients interactive)**: https://fiiir.com/ -- compute and visualize RBJ biquad responses
- **Moog Filter Papers archive**: https://ccrma.stanford.edu/~jos/filters/Four_Pole_Ladder_Filter.html -- Smith's analysis of Moog circuit

### Modular Synthesis Patching (Conceptual Reference)

- **VCV Rack**: https://vcvrack.com/ -- open source virtual Eurorack modular, excellent modulation matrix reference
- **Max/MSP**: https://cycling74.com/ -- visual DSP patching environment used heavily in computer music research
