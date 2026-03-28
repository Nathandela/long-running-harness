---
title: "DAW Design Patterns: Transport, Non-Destructive Editing, Routing, and Session Architecture"
date: 2026-03-28
summary: "Survey of architectural patterns used in professional Digital Audio Workstations including transport systems, non-destructive editing, signal routing, session management, and undo/redo strategies."
keywords: [daw, transport-system, non-destructive-editing, audio-routing, session-architecture]
---

# DAW Design Patterns: Transport, Non-Destructive Editing, Routing, and Session Architecture

## Abstract

Digital Audio Workstations (DAWs) represent one of the most architecturally complex categories of professional software, requiring sub-millisecond timing precision, deterministic undo/redo across heterogeneous state, multi-threaded real-time audio processing, and scalable project management for sessions containing thousands of audio events. This survey examines the canonical design patterns employed in professional DAWs — specifically Ableton Live, Logic Pro X, and Reaper — across seven architectural domains: transport system design, non-destructive editing models, signal routing topology, mixer architecture, session/project serialization, arrangement view rendering, and MIDI subsystems. Each domain is analyzed from both theoretical and implementation perspectives, with concrete data structures and algorithms documented in TypeScript/pseudocode. This document serves as primary reference material for AI agents building a browser-based DAW with React and the Web Audio API.

---

## 1. Introduction

A DAW is not a single application but a composition of loosely coupled real-time and non-real-time subsystems that must cooperate with hard timing constraints. The central challenge is that audio must be delivered to the hardware output buffer at a fixed, sample-accurate rate — typically 44,100 or 48,000 samples per second — while the UI must remain responsive for editing operations that can invalidate large portions of the audio graph. The two subsystems operate on fundamentally different timescales: the audio engine operates in 128-512 sample blocks (2-11 ms per callback), while UI frames execute at 16 ms intervals, and user-triggered edits may take 50-500 ms to serialize to disk.

Professional DAWs have converged on a set of architectural patterns that decouple these subsystems while preserving coherence. This paper surveys those patterns with enough depth and precision that an implementation team — including AI coding agents — can make correct architectural decisions from first principles.

### 1.1 Scope

The survey covers DAW architectures up to Q1 2026, with primary focus on:

- **Ableton Live 12** — clip-based session and arrangement views, envelope-driven automation, link synchronization
- **Logic Pro 11** — region-based timeline, Smart Tempo, Flex Pitch/Time, Summing Stack busses
- **Reaper 7** — item/take system, flexible routing matrix, JSFX, per-item rate/pitch transforms

Browser-based implementations considered include:

- **Bandlab** (React + Web Audio)
- **Soundtrap** (Backbone + Web Audio)
- **Chrome Music Lab** (Tone.js primitives)
- **Tone.js** — open-source scheduling/transport library
- **WAM (Web Audio Modules) 2.0** standard

---

## 2. Foundational Concepts

### 2.1 The Audio Render Graph

Every DAW audio engine is, at its core, a directed acyclic graph (DAG) of processing nodes. Nodes have typed input and output ports carrying multi-channel audio buffers and control signals. The render thread executes a topological sort of the graph once per audio callback, filling each node's output buffer from its input buffers.

```
AudioSource → [Insert Chain] → Fader → Pan → [Send Taps] → Bus → Master → Hardware
```

The graph must be lock-free with respect to the UI thread. Structural mutations (adding/removing nodes, rewiring edges) use double-buffering or read-copy-update patterns to avoid blocking the render thread.

### 2.2 The Timeline Model

A DAW timeline maps between two coordinate systems:

1. **Musical time** — bars, beats, ticks (BBT). A "tick" is a subdivision of a beat, typically 480 or 960 PPQN (pulses per quarter note).
2. **Sample time** — an integer count of audio samples from the session start, at a fixed sample rate.

The conversion between these systems requires a **tempo map** — a piecewise function that accumulates tempo changes and time signature changes over the session length. This is the mathematical foundation of all transport behavior.

### 2.3 Thread Model

```
UI Thread (16ms)
  └── React state mutations, command dispatch, session serialization

Audio Thread (per callback, ~2-11ms)
  └── Lock-free reads from atomically-swapped graph snapshot
  └── Sample-accurate event scheduling from event queue

Disk I/O Thread
  └── Prefetch audio from files into ring buffers
  └── Session save/load

MIDI Thread (system-level)
  └── Timestamped MIDI event delivery to audio thread queue
```

The most critical invariant: **the audio thread never blocks**. It cannot acquire mutexes, allocate heap memory, or perform I/O.

---

## 3. Transport System Architecture

### 3.1 Tempo Map

The tempo map is the central data structure of the transport system. It is an ordered sequence of **tempo events**, where each event specifies a musical position, a BPM value, and optionally a curve type for interpolation.

```typescript
type TempoEventCurve = 'constant' | 'linear' | 'exponential';

interface TempoEvent {
  /** Musical position where this tempo takes effect */
  positionBeats: number;       // absolute beats from session start
  /** Computed sample position (cached, derived from preceding events) */
  positionSamples: number;
  bpm: number;
  curve: TempoEventCurve;
}

interface TimeSignatureEvent {
  positionBars: number;        // bar number (1-indexed)
  positionBeats: number;       // absolute beat from session start
  numerator: number;           // beats per bar
  denominator: number;         // note value of one beat (4 = quarter, 8 = eighth)
}

interface TempoMap {
  tempoEvents: TempoEvent[];          // sorted by positionBeats
  timeSigEvents: TimeSignatureEvent[]; // sorted by positionBars
  sampleRate: number;
}
```

#### 3.1.1 Beat-to-Sample Conversion

Given a constant-BPM segment from event `e` to the next event `e+1`:

```
samplesPerBeat = (sampleRate * 60) / bpm
deltaSamples = deltaBeats * samplesPerBeat
```

For linear tempo ramps (as used in Ableton Live's automation and Logic Pro's Smart Tempo):

```
// BPM linearly interpolates from bpm0 to bpm1 over deltaBeats
// Integral of samplesPerBeat(beat) dbeat from 0 to deltaBeats:
//   = sampleRate * 60 * integral(1/bpm(t) dt)
// where bpm(t) = bpm0 + (bpm1 - bpm0) * t / deltaBeats

function beatsToSamplesLinearRamp(
  deltaBeats: number,
  bpm0: number,
  bpm1: number,
  sampleRate: number
): number {
  if (Math.abs(bpm0 - bpm1) < 1e-9) {
    return (deltaBeats * sampleRate * 60) / bpm0;
  }
  // integral of 60*SR / (bpm0 + k*t) dt from 0 to deltaBeats
  // = 60*SR/k * ln(bpm1/bpm0)
  const k = (bpm1 - bpm0) / deltaBeats;
  return (60 * sampleRate / k) * Math.log(bpm1 / bpm0);
}
```

The tempo map must cache cumulative sample offsets at each tempo event to make O(log n) lookup possible:

```typescript
function buildTempoMapCache(map: TempoMap): void {
  let cumulativeSamples = 0;
  for (let i = 0; i < map.tempoEvents.length; i++) {
    map.tempoEvents[i].positionSamples = cumulativeSamples;
    if (i + 1 < map.tempoEvents.length) {
      const e0 = map.tempoEvents[i];
      const e1 = map.tempoEvents[i + 1];
      const deltaBeats = e1.positionBeats - e0.positionBeats;
      cumulativeSamples += beatsToSamplesSegment(deltaBeats, e0, e1, map.sampleRate);
    }
  }
}
```

#### 3.1.2 Sample-to-Beat Inverse

The inverse (sample -> beat position) is needed for MIDI recording with latency compensation and display of the playhead cursor. Because the function is monotonically increasing, binary search over the cached tempo events suffices:

```typescript
function sampleToBeats(sample: number, map: TempoMap): number {
  // Binary search for the enclosing segment
  let lo = 0, hi = map.tempoEvents.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (map.tempoEvents[mid].positionSamples <= sample) lo = mid;
    else hi = mid - 1;
  }
  const e0 = map.tempoEvents[lo];
  const deltaSamples = sample - e0.positionSamples;
  // Invert the beats->samples formula for the segment type
  return e0.positionBeats + samplesToBeatsSegment(deltaSamples, e0, map, lo);
}
```

### 3.2 BBT (Bar/Beat/Tick) Representation

Musical positions are most naturally expressed as `(bar, beat, tick)` triples. A "tick" is a sub-beat subdivision; Reaper uses 960 PPQN, Logic uses 480 PPQN, Ableton Live uses 1/128 note (1/32 of a beat at 4/4).

```typescript
interface BBT {
  bar: number;   // 1-indexed
  beat: number;  // 1-indexed within bar
  tick: number;  // 0-indexed within beat, range [0, PPQN)
}

const PPQN = 960; // pulses per quarter note

function bbtToBeats(bbt: BBT, timeSigNumerator: number, timeSigDenominator: number): number {
  // beats per bar depends on time signature
  // e.g. 6/8 has 6 eighth notes per bar = 3 quarter-beat equivalents
  const beatsPerBar = timeSigNumerator * (4 / timeSigDenominator);
  const absoluteBeats =
    (bbt.bar - 1) * beatsPerBar +
    (bbt.beat - 1) +
    bbt.tick / PPQN;
  return absoluteBeats;
}
```

Time signature changes require iterating through `timeSigEvents` to accumulate bars correctly, since a 5/4 section has different bar lengths than a 4/4 section.

### 3.3 Loop Regions and Punch In/Out

```typescript
interface LoopRegion {
  startBeats: number;
  endBeats: number;
  enabled: boolean;
}

interface PunchRegion {
  punchInBeats: number;
  punchOutBeats: number;
  punchInEnabled: boolean;
  punchOutEnabled: boolean;
}
```

Loop behavior in the audio engine: when the playhead reaches `loopRegion.endBeats`, it wraps to `loopRegion.startBeats` without stopping the transport. In a sample-accurate implementation, this wrap may occur mid-buffer. The audio callback splits the buffer at the wrap point, processes the tail segment from the loop end, then the head segment from the loop start.

**Reaper** implements loop with a "loop item" concept where items crossing the loop boundary are automatically sliced. **Ableton Live** loops the entire session or a launch region. **Logic Pro** uses a cycle region that can be set independently from the arrangement.

Punch recording: the engine records audio only between `punchIn` and `punchOut`. Pre-roll is used to let the performer hear context before punch-in. Logic Pro's punch-in engages recording precisely at the punch-in sample without gap or click — achieved by pre-arming the track and opening the record buffer at pre-roll start, but only committing samples after `punchInSample`.

### 3.4 Metronome Implementation

The metronome is a click track synthesized directly in the audio engine at the correct beat positions, with accent on beat 1 of each bar.

```typescript
interface MetronomeConfig {
  enabled: boolean;
  accentBeat1: boolean;
  accentPitch: number;     // MIDI note, e.g. 80
  normalPitch: number;     // MIDI note, e.g. 72
  accentVelocity: number;  // 0-127
  normalVelocity: number;
  soundType: 'click' | 'beep' | 'cowbell' | 'custom';
  countInBars: number;     // pre-roll bar count
}
```

Beat positions for the current buffer are computed by the transport:

```typescript
function getBeatEventsInBuffer(
  startSample: number,
  bufferSize: number,
  tempoMap: TempoMap,
  timeSigEvents: TimeSignatureEvent[]
): Array<{ offsetInBuffer: number; beat: BBT; isAccent: boolean }> {
  const endSample = startSample + bufferSize;
  const events = [];
  // Iterate over beat positions within [startSample, endSample)
  // Convert each beat's sample position to buffer offset
  // ...
  return events;
}
```

**Ableton Live's** metronome click is a short PCM sample with decay, pre-synthesized and stored as a float buffer. Beat timing uses the internal high-resolution scheduler, not the system timer. **Logic Pro** uses a synthesized beep derived from an FM oscillator. **Reaper** allows arbitrary WAV files as metronome sounds.

### 3.5 Pre-roll and Count-In

Count-in is implemented as a negative transport position relative to the playback start point. When the user presses Record, the transport seeks to `startPoint - countInBars * beatsPerBar` and begins playing. The metronome fires during the count-in region but recording gates are closed until the transport reaches `startPoint`.

```typescript
function computePrerollStart(
  recordStart: number, // in beats
  countInBars: number,
  timeSig: TimeSignatureEvent
): number {
  const beatsPerBar = timeSig.numerator * (4 / timeSig.denominator);
  return recordStart - countInBars * beatsPerBar;
}
```

### 3.6 Play Cursor Synchronization

The UI play cursor must track the audio engine's current position. Because the audio engine runs on a separate thread and advances in block-sized increments, a naive approach produces "jumpy" cursor animation. Professional DAWs use two techniques:

**Technique 1: Atomic position + interpolation.** The audio thread atomically writes the current sample position after each block. The UI thread reads this value at 60fps and interpolates based on the known tempo at that position plus elapsed wall-clock time since the last audio callback.

**Technique 2: Web Audio API `currentTime`.** In browser implementations, `AudioContext.currentTime` provides a continuously updated, high-precision clock synchronized with the audio hardware. Schedule events as `audioContext.currentTime + offset` and render the cursor as:

```typescript
function getPlayheadBeats(
  transportState: TransportState,
  audioContext: AudioContext,
  tempoMap: TempoMap
): number {
  if (!transportState.isPlaying) return transportState.positionBeats;
  const elapsedSeconds = audioContext.currentTime - transportState.startAudioTime;
  const elapsedSamples = elapsedSeconds * tempoMap.sampleRate;
  return sampleToBeats(transportState.startSample + elapsedSamples, tempoMap);
}
```

This is the approach used in **Tone.js** and is the recommended pattern for browser DAWs.

### 3.7 External Synchronization

**MIDI Clock** sends 24 pulses per quarter note. The DAW can act as clock master (generating pulses) or slave (following received pulses). Implementation requires a MIDI output port and scheduling pulses at the correct sample positions.

**Ableton Link** (open protocol) synchronizes BPM and beat phase across networked devices using a gossip protocol. It operates over UDP and exposes a C++ API that can be wrapped for JavaScript via WebAssembly.

**SMPTE/MTC** (MIDI Time Code) is used for synchronization with video and film hardware, encoding hours/minutes/seconds/frames as quarter-frame MIDI messages.

---

## 4. Non-Destructive Editing Model

### 4.1 Core Data Model: Clips and Regions

Non-destructive editing means that edits never modify the underlying audio file. Instead, all edits manipulate a data structure that describes how to read from the source file. This structure is called a **clip** (Ableton), **region** (Logic), or **item** (Reaper).

```typescript
interface AudioSource {
  id: string;
  filePath: string;       // absolute path in media pool
  sampleRate: number;
  channels: number;
  durationSamples: number;
  hash: string;           // SHA-256 of file content for integrity
}

interface AudioClip {
  id: string;
  sourceId: string;          // reference into MediaPool
  /** Position in the timeline (beats) */
  timelineStartBeats: number;
  /** How far into the source to start reading (samples) */
  sourceOffsetSamples: number;
  /** Length of the clip in the timeline (beats) */
  durationBeats: number;
  /** Gain applied to this clip's output, linear amplitude */
  gainLinear: number;
  /** Pan, -1.0 (hard left) to +1.0 (hard right) */
  pan: number;
  /** Pitch shift in semitones */
  pitchShiftSemitones: number;
  /** Playback rate multiplier (1.0 = normal) */
  playbackRate: number;
  fadeIn: FadeDescriptor;
  fadeOut: FadeDescriptor;
  /** Whether the clip loops its source content */
  looped: boolean;
}

interface FadeDescriptor {
  durationBeats: number;
  curve: 'linear' | 'equal-power' | 'logarithmic' | 'exponential' | 's-curve';
}
```

The critical invariant is that `sourceOffsetSamples` is always in source-file sample coordinates, not timeline coordinates. When the user trims the left edge of a clip (moving the start point right), only `timelineStartBeats` and `sourceOffsetSamples` change — the source file is never touched.

**Reaper's take model** extends this with multiple "takes" per item: each item can have N alternative recordings, with only one active at a time. This enables comping workflows where the user records multiple passes of a phrase and selects the best regions from each.

```typescript
interface TakeItem {
  id: string;
  timelineStartBeats: number;
  durationBeats: number;
  activeTakeIndex: number;
  takes: AudioClip[];       // all recorded passes
}
```

### 4.2 Clip Operations

All edit operations follow the Command pattern (see Section 4.4) and operate on the clip data model without touching audio files.

#### 4.2.1 Split

Split divides one clip into two at a given position:

```typescript
function splitClip(clip: AudioClip, splitPositionBeats: number): [AudioClip, AudioClip] {
  const splitOffsetBeats = splitPositionBeats - clip.timelineStartBeats;
  // Convert splitOffsetBeats to source samples using the clip's tempo context
  const splitOffsetSamples = beatsToSamples(splitOffsetBeats, tempoMap) * clip.playbackRate;

  const left: AudioClip = {
    ...clip,
    id: generateId(),
    durationBeats: splitOffsetBeats,
    fadeOut: { durationBeats: 0, curve: 'linear' }, // remove fade if any
  };

  const right: AudioClip = {
    ...clip,
    id: generateId(),
    timelineStartBeats: splitPositionBeats,
    sourceOffsetSamples: clip.sourceOffsetSamples + splitOffsetSamples,
    durationBeats: clip.durationBeats - splitOffsetBeats,
    fadeIn: { durationBeats: 0, curve: 'linear' },
  };

  return [left, right];
}
```

#### 4.2.2 Trim

Trim adjusts either the left edge (`trimLeft`) or right edge (`trimRight`):

```typescript
function trimLeft(clip: AudioClip, newStartBeats: number): AudioClip {
  const deltaBeats = newStartBeats - clip.timelineStartBeats;
  const deltaSamples = beatsToSamples(deltaBeats, tempoMap) * clip.playbackRate;
  return {
    ...clip,
    timelineStartBeats: newStartBeats,
    sourceOffsetSamples: clip.sourceOffsetSamples + deltaSamples,
    durationBeats: clip.durationBeats - deltaBeats,
  };
}

function trimRight(clip: AudioClip, newEndBeats: number): AudioClip {
  return {
    ...clip,
    durationBeats: newEndBeats - clip.timelineStartBeats,
  };
}
```

Note that trimming beyond the source file boundaries is clamped to `[0, sourceDurationSamples]`.

#### 4.2.3 Move and Duplicate

```typescript
function moveClip(clip: AudioClip, newStartBeats: number): AudioClip {
  return { ...clip, timelineStartBeats: newStartBeats };
}

function duplicateClip(clip: AudioClip, newStartBeats: number): AudioClip {
  return { ...clip, id: generateId(), timelineStartBeats: newStartBeats };
}
```

#### 4.2.4 Reverse

Reverse is a non-destructive flag. The audio engine reads the source buffer backwards when this flag is set:

```typescript
interface AudioClip {
  // ...
  reversed: boolean;
}
```

During audio rendering, if `reversed` is true, the read pointer starts at `sourceOffsetSamples + durationSamples` and decrements. **Ableton Live** implements reverse as a destructive operation that creates a new audio file (a limitation of their architecture). **Reaper** and **Logic Pro** implement true non-destructive reverse.

### 4.3 Overlap Handling and Crossfades

When two clips on the same track overlap, the DAW must decide how to handle the overlap region. Three strategies exist:

**Strategy 1: Latest clip wins.** The clip with the higher z-order (later-added) completely replaces the earlier one in the overlap region. Simple but lossy from a user perspective. Used by Ableton Live by default.

**Strategy 2: Automatic crossfade.** The DAW automatically creates a crossfade in the overlap region. This is the default in Logic Pro.

```typescript
interface CrossfadeRegion {
  startBeats: number;
  endBeats: number;
  leftClipId: string;
  rightClipId: string;
  curve: FadeCurve;
}
```

During rendering, the crossfade blends the two clips:

```typescript
function renderCrossfade(
  leftBuffer: Float32Array,
  rightBuffer: Float32Array,
  outputBuffer: Float32Array,
  crossfade: CrossfadeRegion,
  currentSample: number,
  sampleRate: number
): void {
  for (let i = 0; i < outputBuffer.length; i++) {
    const t = getCrossfadePosition(crossfade, currentSample + i, sampleRate);
    // t = 0.0 at crossfade start, 1.0 at crossfade end
    const leftGain = equalPowerFadeOut(t);
    const rightGain = equalPowerFadeIn(t);
    outputBuffer[i] = leftBuffer[i] * leftGain + rightBuffer[i] * rightGain;
  }
}

// Equal-power crossfade (constant perceived loudness)
const equalPowerFadeOut = (t: number) => Math.cos(t * Math.PI / 2);
const equalPowerFadeIn  = (t: number) => Math.sin(t * Math.PI / 2);
```

**Strategy 3: User-defined.** The user explicitly creates crossfades by dragging the overlap region. Reaper uses this model, giving maximum control.

### 4.4 Undo/Redo with the Command Pattern

The command pattern wraps every edit operation as an invertible object. The undo stack is a list of commands; undo pops and inverts, redo re-executes.

```typescript
interface Command<S> {
  execute(state: S): S;
  undo(state: S): S;
  description: string;  // human-readable for UI display
}

class UndoStack<S> {
  private past: Command<S>[] = [];
  private future: Command<S>[] = [];
  private maxDepth: number;

  constructor(maxDepth = 500) {
    this.maxDepth = maxDepth;
  }

  execute(state: S, command: Command<S>): S {
    const nextState = command.execute(state);
    this.past.push(command);
    this.future = [];  // new edit clears redo history
    if (this.past.length > this.maxDepth) this.past.shift();
    return nextState;
  }

  undo(state: S): S {
    const command = this.past.pop();
    if (!command) return state;
    this.future.push(command);
    return command.undo(state);
  }

  redo(state: S): S {
    const command = this.future.pop();
    if (!command) return state;
    this.past.push(command);
    return command.execute(state);
  }
}
```

Concrete command implementations:

```typescript
class SplitClipCommand implements Command<TrackState> {
  private splitResult: [AudioClip, AudioClip] | null = null;

  constructor(
    private trackId: string,
    private clipId: string,
    private splitPositionBeats: number
  ) {}

  execute(state: TrackState): TrackState {
    const track = state.tracks.find(t => t.id === this.trackId)!;
    const clip = track.clips.find(c => c.id === this.clipId)!;
    this.splitResult = splitClip(clip, this.splitPositionBeats);
    return replaceClipWithTwo(state, this.trackId, this.clipId, this.splitResult);
  }

  undo(state: TrackState): TrackState {
    if (!this.splitResult) return state;
    return removeTwoClipsAddOne(
      state,
      this.trackId,
      this.splitResult[0].id,
      this.splitResult[1].id,
      // reconstruct original clip
      reconstructOriginal(this.splitResult)
    );
  }

  get description() {
    return `Split clip at ${this.splitPositionBeats.toFixed(3)} beats`;
  }
}
```

**Ableton Live** uses a pure-functional state model internally: each operation produces a new state snapshot, making undo trivial (store previous state snapshots). This is memory-intensive but correct. The snapshot approach is viable in browser implementations using immutable data structures (Immer, structural sharing).

**Logic Pro** and **Reaper** use classical forward/inverse commands, storing only the delta. This is more memory-efficient for large sessions but requires careful inverse implementation.

For browser DAWs, the **Immer + Redux-style** approach is recommended: represent session state as an immutable object, use Immer for produce mutations, and store the history as a bounded stack of past states. At 1000 clips this is typically a few MB per snapshot, which is acceptable.

### 4.5 Audio File Management

#### 4.5.1 Media Pool

The media pool (Logic: "Audio Files Bin"; Reaper: "Media Explorer") is a registry of all audio files referenced by the session:

```typescript
interface MediaPool {
  sources: Map<string, AudioSource>;  // id -> AudioSource
  /** Root directory for relative path resolution */
  projectDirectory: string;
}
```

Clips reference sources by ID, not file path. This enables renaming/moving files without breaking the session, provided the media pool is updated.

#### 4.5.2 Referenced vs Embedded

- **Referenced**: Audio files remain at their original disk location. The session file stores only paths. Portable but fragile (moving files breaks references).
- **Embedded**: Audio file data is stored within the session file (e.g., as base64 blobs in JSON, or as a ZIP archive). Self-contained but large.
- **Collected/Consolidated**: A hybrid where the DAW copies all referenced files into a project-specific directory alongside the session file. This is the "Save Project As" model used by all three DAWs.

For browser DAWs, the Web File System Access API enables referenced files, while OPFS (Origin Private File System) provides embedded storage. For portability, session export should produce a ZIP containing the session JSON and all referenced audio files.

---

## 5. Signal Routing Architecture

### 5.1 Track Types

```typescript
type TrackType =
  | 'audio'        // plays back audio clips, accepts audio input
  | 'instrument'   // hosts a virtual instrument, produces audio from MIDI
  | 'midi'         // carries MIDI data, routes to instrument tracks
  | 'bus'          // receives sends from other tracks, applies processing
  | 'aux'          // similar to bus, used for parallel processing
  | 'master'       // single master output track
  | 'return'       // same as bus in most DAWs (Logic/Ableton naming)
  | 'folder';      // organizational container (no audio processing)
```

**Ableton Live** terminology: "Audio Track", "MIDI Track", "Return Track", "Master Track". Group tracks are created by nesting.

**Logic Pro**: "Audio", "Software Instrument", "MIDI External", "Aux", "Master", "Summing Stack Sub". Summing stacks are Logic's unique model where grouped tracks feed a hidden summing bus automatically.

**Reaper**: No fixed track types. Every track can receive any combination of audio/MIDI and route to any other track. Track type is determined by what is inserted on it (instruments convert MIDI to audio).

### 5.2 Channel Strip Signal Flow

The canonical signal flow through a single track's channel strip:

```
[Audio Input / Clip Playback]
         |
    [Pre-Insert FX Chain]        <- plugins before the fader (Reaper: "pre-FX")
         |
    [EQ]                         <- often integrated as a special pre-insert slot
         |
    [Dynamics]                   <- compressor/gate often gets dedicated slot
         |
    [Fader (Volume)]             <- linear amplitude, 0.0 - 2.0 (0 dB = 1.0)
         |
    [Pan]                        <- stereo positioning
         |
    [Post-Fader Sends]           <- to bus/return tracks (post-fader = affected by fader)
    [Pre-Fader Sends]            <- to bus/return tracks (pre-fader = independent of fader)
         |
    [Post-Insert FX Chain]       <- rare: plugins after fader
         |
    [Track Output]               <- routes to bus, master, or another track
```

In Logic Pro and Reaper, the EQ and Dynamics do not occupy special slots — they are simply inserts at positions 1 and 2 by convention. In Ableton Live, the EQ and other devices are part of the "Device Chain" which appears in the Device View, distinct from the mixer.

### 5.3 Insert vs Send Effects

**Insert effect**: Processes the full signal inline. Signal enters the plugin, comes out modified. All signal passes through the insert.

```
Track signal ──→ [Insert Plugin] ──→ continues down channel strip
```

**Send effect (aux send)**: Taps the signal and routes a configurable amount to a separate bus track. The original signal continues unmodified. Used for shared reverbs, delays.

```
Track signal ──→ (continues)
               ↓ (send level)
          [Return/Bus Track]
               ↓
          [Reverb Plugin]
               ↓
          [Mixed into Master]
```

The send level is a pre-fader or post-fader scalar on the tapped signal.

### 5.4 Pre-Fader vs Post-Fader Sends

- **Post-fader send**: The send tap occurs after the channel fader. If the fader is at -inf (muted), the send also goes silent. Reverb sends are almost always post-fader so the reverb tail fades with the dry signal.
- **Pre-fader send**: The send tap occurs before the fader. The send level is independent of the track fader. Used for monitor mixes (cue mixes in Logic/Reaper), where the artist mix must be independent of the control room mix.

```typescript
interface Send {
  id: string;
  fromTrackId: string;
  toTrackId: string;       // target bus/return track
  gainLinear: number;
  panning: number;
  isMuted: boolean;
  tapPoint: 'pre-fader' | 'post-fader' | 'pre-fx';
}
```

### 5.5 Sidechain Routing

Sidechain routing feeds audio from one track into a plugin on another track for side-chain triggering:

```typescript
interface SidechainRoute {
  sourceTrackId: string;    // the "key" or trigger signal
  targetTrackId: string;    // track hosting the plugin
  targetPluginId: string;   // the compressor/gate receiving the sidechain
  tapPoint: 'pre-fader' | 'post-fader';
}
```

The canonical use case: ducking music under voice-over by sidechaining a compressor on the music track to receive the voice-over signal. In the audio render graph, the sidechain creates an additional edge from `sourceTrack` to the sidechain input port of the compressor node.

**Web Audio API implementation**: The `DynamicsCompressorNode` does not expose a sidechain input port. A custom sidechain compressor requires a `ScriptProcessorNode` or `AudioWorkletNode` with two input buses: the main signal and the key signal.

### 5.6 Routing Matrix

Complex routing (multiple sends, multi-bus, multi-output instruments) is managed through a **routing matrix** — a conceptual N×M grid where rows are sources and columns are destinations.

```typescript
interface RoutingMatrix {
  connections: RoutingConnection[];
}

interface RoutingConnection {
  sourceId: string;         // track ID or plugin output ID
  sourceChannel: number;    // 0-indexed channel (0=L, 1=R for stereo)
  destinationId: string;
  destinationChannel: number;
  gainLinear: number;
}
```

**Reaper** exposes its routing matrix directly in the UI, allowing any-to-any connections. Logic Pro abstracts this behind "Output" assignments per track. Ableton Live uses a simplified "Audio From / Audio To" routing per track.

### 5.7 Signal Graph Data Structure

The entire routing graph can be represented as a DAG where nodes are tracks/busses and edges are routing connections:

```typescript
interface AudioGraph {
  nodes: Map<string, AudioGraphNode>;
  edges: AudioGraphEdge[];
}

interface AudioGraphNode {
  id: string;
  type: TrackType;
  insertChain: PluginInstance[];
  fader: number;     // linear amplitude
  pan: number;
}

interface AudioGraphEdge {
  fromId: string;
  toId: string;
  connection: RoutingConnection;
}
```

The render order is a topological sort of this graph. Cycles are invalid and must be detected at routing time (Logic Pro shows a "Routing Cycle" error; Reaper silently breaks cycles).

---

## 6. Mixer Architecture

### 6.1 Channel Strip Components

```typescript
interface ChannelStrip {
  trackId: string;
  inputGain: number;        // pre-insert trim, dB
  insertChain: PluginInstance[];
  faderDb: number;          // -inf to +6 dB typically
  pan: number;              // -1.0 to +1.0
  sends: Send[];
  outputRouting: OutputRouting;
  meter: MeterState;
  soloState: SoloState;
  muteState: MuteState;
  color: string;            // track color for visual organization
  name: string;
}
```

#### 6.1.1 Fader Taper

Professional DAW faders use a non-linear (logarithmic) taper for the control, mapping a normalized fader position (0.0 to 1.0) to a dB value. A common implementation:

```typescript
function faderPositionToDb(position: number): number {
  // position in [0, 1], returns dB
  // Standard Pro Tools-style taper:
  // - 0.0   → -inf (silence)
  // - 0.75  → 0 dB (unity gain)
  // - 1.0   → +6 dB
  if (position <= 0) return -Infinity;
  if (position < 0.75) {
    return -40 * Math.pow(1 - position / 0.75, 2);  // curved lower section
  }
  return (position - 0.75) / 0.25 * 6;  // linear upper section to +6dB
}

function dbToLinear(db: number): number {
  if (!isFinite(db)) return 0;
  return Math.pow(10, db / 20);
}
```

Ableton Live uses a taper where unity (0 dB) is at 70% of fader travel. Logic Pro places unity at approximately 75%. Reaper is configurable.

### 6.2 Metering

#### 6.2.1 Peak Meter

The simplest and most common meter: tracks the absolute peak sample value in a window.

```typescript
class PeakMeter {
  private peakHold: number = 0;
  private peakHoldTimer: number = 0;
  private readonly holdTimeMs: number = 2000;
  private readonly fallbackDbPerSec: number = 20;

  process(buffer: Float32Array, deltaTimeMs: number): number {
    let peak = 0;
    for (const sample of buffer) {
      peak = Math.max(peak, Math.abs(sample));
    }
    if (peak >= this.peakHold) {
      this.peakHold = peak;
      this.peakHoldTimer = this.holdTimeMs;
    } else {
      this.peakHoldTimer -= deltaTimeMs;
      if (this.peakHoldTimer <= 0) {
        // Fall back
        const fallbackLinear = Math.pow(10, -this.fallbackDbPerSec * (deltaTimeMs / 1000) / 20);
        this.peakHold *= fallbackLinear;
      }
    }
    return this.peakHold;
  }
}
```

#### 6.2.2 RMS Meter

RMS (Root Mean Square) approximates perceived loudness better than peak:

```typescript
class RmsMeter {
  private squareAccumulator: number = 0;
  private windowSamples: number;
  private ringBuffer: Float32Array;
  private writeIndex: number = 0;

  constructor(windowMs: number, sampleRate: number) {
    this.windowSamples = Math.floor(windowMs / 1000 * sampleRate);
    this.ringBuffer = new Float32Array(this.windowSamples);
  }

  process(buffer: Float32Array): number {
    for (const sample of buffer) {
      this.squareAccumulator -= this.ringBuffer[this.writeIndex] ** 2;
      this.ringBuffer[this.writeIndex] = sample;
      this.squareAccumulator += sample ** 2;
      this.writeIndex = (this.writeIndex + 1) % this.windowSamples;
    }
    return Math.sqrt(Math.max(0, this.squareAccumulator / this.windowSamples));
  }
}
```

#### 6.2.3 LUFS (Loudness Units Full Scale)

LUFS is the broadcast-standard loudness measure defined in ITU-R BS.1770. It involves:

1. K-weighting filter (pre-filter + RLB filter)
2. Mean square calculation over a gating block (400 ms)
3. Relative threshold gating to exclude quiet passages
4. Integrated, short-term, and momentary variants

LUFS is computationally intensive. For browser DAWs, a Web Audio `AudioWorkletProcessor` running the K-weighting filter and accumulator is the correct implementation. Libraries like `loudness-meter` (npm) provide conformant implementations.

### 6.3 VU Meter

The VU (Volume Unit) meter has a specific attack/decay characteristic defined by ANSI C16.5:

- Attack: 300 ms to reach 99% of steady-state tone
- Decay: 300 ms to fall from full deflection

```typescript
class VuMeter {
  private value: number = 0;
  private readonly attackCoeff: number;
  private readonly decayCoeff: number;

  constructor(sampleRate: number) {
    // Time constants for 300ms VU ballistic at given sample rate
    this.attackCoeff = 1 - Math.exp(-2.2 / (0.3 * sampleRate));
    this.decayCoeff = 1 - Math.exp(-2.2 / (0.3 * sampleRate));
  }

  processSample(input: number): number {
    const absSample = Math.abs(input);
    if (absSample > this.value) {
      this.value += this.attackCoeff * (absSample - this.value);
    } else {
      this.value += this.decayCoeff * (absSample - this.value);
    }
    return this.value;
  }
}
```

### 6.4 Solo and Mute State Machines

Solo/mute behavior is one of the most commonly misimplemented features in DAW clones. There are multiple mutually exclusive solo modes with significantly different semantics.

#### 6.4.1 Solo State Machine

```typescript
type SoloMode = 'solo-in-place' | 'solo-iso' | 'implicit';

type SoloState = {
  soloed: boolean;
  soloIsolated: boolean;  // immune to being muted by other solos
};
```

**Solo-In-Place (SIP)**: When any track is soloed, all other tracks are implicitly muted, except:
- tracks that are also soloed
- tracks that are "solo-isolated" (Reaper: "solo defeat")
- tracks that are fed by a soloed track via sends (bus/return tracks)

```typescript
function computeEffectiveMute(
  trackId: string,
  tracks: Track[],
  soloStates: Map<string, SoloState>
): boolean {
  const anyTrackSoloed = tracks.some(t => soloStates.get(t.id)?.soloed);
  if (!anyTrackSoloed) {
    // No solos active: only explicit mutes apply
    return tracks.find(t => t.id === trackId)?.muted ?? false;
  }
  const state = soloStates.get(trackId)!;
  if (state.soloed) return false;              // soloed tracks play
  if (state.soloIsolated) return false;        // isolated tracks always play
  if (isImplicitlyActivated(trackId, tracks, soloStates)) return false;
  return true;  // implicitly muted by solo
}

// A bus track is implicitly active if any track sending to it is soloed
function isImplicitlyActivated(
  trackId: string,
  tracks: Track[],
  soloStates: Map<string, SoloState>
): boolean {
  return tracks.some(t =>
    soloStates.get(t.id)?.soloed &&
    t.sends.some(s => s.toTrackId === trackId)
  );
}
```

**Implicit Solo**: Logic Pro's default. Soloing a track in a group implicitly solos other tracks in the group.

**AFL (After Fader Listen) / PFL (Pre Fader Listen)**: Studio console concepts. AFL solos the post-fader signal; PFL solos pre-fader. Reaper implements both.

### 6.5 Grouping and Linking

#### 6.5.1 Edit Groups

Edit groups link tracks for editing: operations on one track (trim, split, move) are propagated to all tracks in the group. Used for multi-tracked drums.

```typescript
interface EditGroup {
  id: string;
  trackIds: string[];
  linkAttributes: {
    volume: boolean;
    pan: boolean;
    mute: boolean;
    solo: boolean;
    edits: boolean;      // link clip edits
    automation: boolean;
  };
}
```

#### 6.5.2 VCA Groups

VCA (Voltage Controlled Amplifier) groups allow a single "master fader" to control the relative level of multiple tracks without summing them to a bus. The VCA fader applies an offset in dB to each member track's fader:

```typescript
interface VcaGroup {
  id: string;
  masterFaderDb: number;   // offset applied to all members
  memberTrackIds: string[];
}

function getEffectiveFaderDb(track: Track, vcaGroups: VcaGroup[]): number {
  const vcaOffset = vcaGroups
    .filter(g => g.memberTrackIds.includes(track.id))
    .reduce((sum, g) => sum + g.masterFaderDb, 0);
  return track.faderDb + vcaOffset;
}
```

VCA groups preserve the relative levels between tracks (unlike bus routing which sums signals). **Logic Pro** implements VCA groups natively. **Ableton Live** does not have VCA groups (as of Live 12). **Reaper** has full VCA support.

---

## 7. Session/Project Model

### 7.1 Session File Format

A DAW session file is the complete serializable representation of a project. For a browser DAW, JSON is the natural format.

```typescript
interface Session {
  version: string;           // schema version for migration
  id: string;                // UUID
  name: string;
  createdAt: string;         // ISO 8601
  modifiedAt: string;
  sampleRate: number;        // 44100 | 48000 | 88200 | 96000 | 192000
  bitDepth: number;          // 16 | 24 | 32
  tempoMap: TempoMap;
  timeSigEvents: TimeSignatureEvent[];
  transport: TransportSettings;
  tracks: Track[];
  mixerState: MixerState;
  mediaPool: MediaPool;
  automationData: AutomationLane[];
  masterBus: MasterBusSettings;
  metronome: MetronomeConfig;
  loopRegion: LoopRegion;
  punchRegion: PunchRegion;
  viewState: ArrangementViewState; // zoom, scroll, track heights
  metadata: SessionMetadata;
}
```

#### 7.1.1 Audio File References

Audio file paths in `MediaPool` are stored as relative paths from the session file's directory:

```typescript
interface AudioSource {
  id: string;
  relativePath: string;   // e.g., "audio/take-001.wav"
  absolutePath?: string;  // resolved at load time, not serialized
  // ...
}
```

At save time, `absolutePath` is stripped. At load time, it is resolved using the session directory. If not found, the DAW shows a "missing file" dialog, similar to Logic Pro's "Reconnect Media" workflow.

### 7.2 Schema Versioning and Migration

Sessions accumulate schema changes over time. A migration system is required:

```typescript
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (session: unknown) => unknown;
}

const migrations: Migration[] = [
  {
    fromVersion: '1.0',
    toVersion: '1.1',
    migrate: (session: any) => ({
      ...session,
      // Add new field with default value
      loopRegion: session.loopRegion ?? { startBeats: 0, endBeats: 8, enabled: false },
    }),
  },
  // ...
];

function migrateSession(rawData: unknown, targetVersion: string): Session {
  let data = rawData as any;
  let currentVersion = data.version ?? '1.0';
  while (currentVersion !== targetVersion) {
    const migration = migrations.find(m => m.fromVersion === currentVersion);
    if (!migration) throw new Error(`No migration from ${currentVersion}`);
    data = migration.migrate(data);
    currentVersion = migration.toVersion;
  }
  return data as Session;
}
```

### 7.3 Auto-Save and Crash Recovery

```typescript
interface AutoSaveConfig {
  intervalMs: number;        // 30000 (30 seconds) is standard
  maxBackups: number;        // 10 rolling backups
  backupDirectory: string;   // ".backup/" relative to session dir
}
```

Auto-save should never overwrite the primary session file. Instead, it writes to a timestamped backup file:

```
project.daw.json           ← primary session (saved by user)
.backup/
  project.2026-03-28T14-30-00.daw.json
  project.2026-03-28T14-30-30.daw.json
  ...
```

At session open, if a backup file exists with a modification time newer than the primary file, the DAW offers to restore from the backup — the crash recovery dialog used by Logic Pro ("An auto-saved version of this project is available...").

For browser DAWs, `localStorage` or IndexedDB serves as the auto-save store:

```typescript
async function autoSave(session: Session, db: IDBDatabase): Promise<void> {
  const serialized = JSON.stringify(session);
  await idbPut(db, 'autosave', { id: session.id, data: serialized, savedAt: Date.now() });
}
```

### 7.4 Project Packaging

"Collect and Save" creates a self-contained project folder:

```typescript
async function collectProject(
  session: Session,
  outputDirectory: FileSystemDirectoryHandle
): Promise<void> {
  // 1. Create "Audio Files" subdirectory
  const audioDir = await outputDirectory.getDirectoryHandle('Audio Files', { create: true });

  // 2. Copy each referenced audio file
  for (const source of session.mediaPool.sources.values()) {
    const destHandle = await audioDir.getFileHandle(source.fileName, { create: true });
    await copyFile(source.absolutePath, destHandle);
    source.relativePath = `Audio Files/${source.fileName}`;
  }

  // 3. Write session file with updated paths
  const sessionHandle = await outputDirectory.getFileHandle(`${session.name}.daw.json`, { create: true });
  const writable = await sessionHandle.createWritable();
  await writable.write(JSON.stringify(session, null, 2));
  await writable.close();
}
```

---

## 8. Arrangement View Patterns

### 8.1 Timeline Rendering Model

The arrangement view renders the timeline as a 2D canvas where:

- **X axis** = time (beats or seconds)
- **Y axis** = tracks

The viewport is defined by `{ scrollBeats, scrollTrackIndex, pixelsPerBeat, trackHeightPx }`. All rendering is relative to the viewport.

```typescript
interface ViewportState {
  scrollBeats: number;       // leftmost visible beat position
  scrollTrackIndex: number;  // topmost visible track index
  pixelsPerBeat: number;     // zoom level
  trackHeightPx: number;
  canvasWidth: number;
  canvasHeight: number;
}

function beatsToPixels(beats: number, viewport: ViewportState): number {
  return (beats - viewport.scrollBeats) * viewport.pixelsPerBeat;
}

function pixelsToBeats(pixels: number, viewport: ViewportState): number {
  return pixels / viewport.pixelsPerBeat + viewport.scrollBeats;
}
```

### 8.2 Zoom and Scroll

Zoom should be centered on the mouse cursor position (pinch-to-zoom on trackpad), maintaining the beat position under the cursor:

```typescript
function zoomAroundPoint(
  viewport: ViewportState,
  pivotPixels: number,
  zoomFactor: number
): ViewportState {
  const pivotBeats = pixelsToBeats(pivotPixels, viewport);
  const newPixelsPerBeat = viewport.pixelsPerBeat * zoomFactor;
  // After zoom, pivotBeats must still map to pivotPixels
  const newScrollBeats = pivotBeats - pivotPixels / newPixelsPerBeat;
  return { ...viewport, pixelsPerBeat: newPixelsPerBeat, scrollBeats: newScrollBeats };
}
```

For large sessions (10,000+ clips), rendering all clips every frame is too slow. A spatial index (interval tree or R-tree on the beat axis) enables efficient viewport culling:

```typescript
function getVisibleClips(clips: AudioClip[], viewport: ViewportState): AudioClip[] {
  const startBeats = viewport.scrollBeats;
  const endBeats = startBeats + viewport.canvasWidth / viewport.pixelsPerBeat;
  // Interval tree query: clips overlapping [startBeats, endBeats]
  return clipIntervalTree.query(startBeats, endBeats);
}
```

At extreme zoom-out, clips smaller than 1 pixel are merged into a "density visualization" similar to Ableton Live's arrangement view at low zoom.

### 8.3 Snap-to-Grid

Snap maps a raw beat position to the nearest grid line:

```typescript
type GridResolution =
  | { type: 'bar' }
  | { type: 'beat' }
  | { type: 'subdivision'; subdivisions: number }  // e.g. 4 = 1/4 beat
  | { type: 'triplet'; base: number }               // triplet grid
  | { type: 'none' };

function snapToGrid(
  positionBeats: number,
  resolution: GridResolution,
  beatsPerBar: number
): number {
  const gridSize = getGridSizeBeats(resolution, beatsPerBar);
  if (gridSize <= 0) return positionBeats;
  return Math.round(positionBeats / gridSize) * gridSize;
}

function getGridSizeBeats(resolution: GridResolution, beatsPerBar: number): number {
  switch (resolution.type) {
    case 'bar': return beatsPerBar;
    case 'beat': return 1;
    case 'subdivision': return 1 / resolution.subdivisions;
    case 'triplet': return (2 / 3) / resolution.base;
    case 'none': return 0;
  }
}
```

**Magnetic snap** (Ableton Live) applies a "gravity well" effect: the snap is only engaged if the cursor is within a threshold distance of the nearest grid line.

```typescript
function magneticSnap(
  positionBeats: number,
  resolution: GridResolution,
  viewport: ViewportState,
  magnetThresholdPx: number = 8
): number {
  const gridSize = getGridSizeBeats(resolution, /* ... */);
  const snapped = snapToGrid(positionBeats, resolution, /* ... */);
  const distancePx = Math.abs(snapped - positionBeats) * viewport.pixelsPerBeat;
  return distancePx <= magnetThresholdPx ? snapped : positionBeats;
}
```

### 8.4 Track Folding and Grouping

Folder tracks contain subtracks and can be collapsed to a single row:

```typescript
interface FolderTrack {
  id: string;
  name: string;
  collapsed: boolean;
  childTrackIds: string[];
}
```

When collapsed, the folder track shows a summed waveform of all child clips. This requires pre-rendering a "miniature" waveform of the group — either by summing the audio in a background worker or by averaging the visual waveform data.

### 8.5 Automation Lanes

Automation lanes are sub-rows beneath a track displaying parameter automation as breakpoint curves.

```typescript
interface AutomationLane {
  id: string;
  trackId: string;
  parameterId: string;    // e.g., "fader", "pan", "plugin-1.param-3"
  parameterName: string;
  visible: boolean;
  height: number;         // in pixels
  breakpoints: AutomationPoint[];
  interpolation: 'linear' | 'exponential' | 'step' | 'bezier';
}

interface AutomationPoint {
  positionBeats: number;
  value: number;          // normalized [0, 1] within parameter range
  curveType?: 'ease-in' | 'ease-out' | 'ease-in-out'; // for bezier segments
}
```

Automation evaluation at a given beat position:

```typescript
function evaluateAutomation(lane: AutomationLane, positionBeats: number): number {
  if (lane.breakpoints.length === 0) return 0.5;
  if (positionBeats <= lane.breakpoints[0].positionBeats) return lane.breakpoints[0].value;
  const last = lane.breakpoints[lane.breakpoints.length - 1];
  if (positionBeats >= last.positionBeats) return last.value;

  // Binary search for enclosing segment
  let lo = 0, hi = lane.breakpoints.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lane.breakpoints[mid].positionBeats <= positionBeats) lo = mid;
    else hi = mid - 1;
  }

  const p0 = lane.breakpoints[lo];
  const p1 = lane.breakpoints[lo + 1];
  const t = (positionBeats - p0.positionBeats) / (p1.positionBeats - p0.positionBeats);
  return interpolate(p0.value, p1.value, t, lane.interpolation);
}
```

**Ableton Live** uses breakpoint-based automation with linear, exponential, and bezier curve handles. **Logic Pro** uses "Hyper Draw" for simple automation and a full "Automation Editor" for complex curves. **Reaper** supports custom envelope shapes per segment.

---

## 9. MIDI Subsystem

### 9.1 MIDI Event Model

```typescript
type MidiEventType =
  | 'note-on'
  | 'note-off'
  | 'control-change'
  | 'program-change'
  | 'pitch-bend'
  | 'aftertouch'
  | 'poly-aftertouch'
  | 'sysex';

interface MidiEvent {
  type: MidiEventType;
  channel: number;      // 1-16
  timestamp: number;    // beats from session start (for stored events)
                        // or AudioContext.currentTime (for live events)
}

interface NoteOnEvent extends MidiEvent {
  type: 'note-on';
  note: number;         // 0-127 (60 = middle C)
  velocity: number;     // 0-127
}

interface NoteOffEvent extends MidiEvent {
  type: 'note-off';
  note: number;
  velocity: number;     // often ignored, sometimes used for release time
}

interface ControlChangeEvent extends MidiEvent {
  type: 'control-change';
  controller: number;   // 0-127 (e.g., 7=volume, 10=pan, 64=sustain)
  value: number;        // 0-127
}

interface PitchBendEvent extends MidiEvent {
  type: 'pitch-bend';
  value: number;        // -8192 to +8191 (0 = center)
}
```

MIDI notes are commonly stored as start/end pairs rather than note-on/note-off pairs, since the duration is the musically relevant attribute:

```typescript
interface MidiNote {
  id: string;
  note: number;
  velocity: number;
  startBeats: number;
  durationBeats: number;
  channel: number;
}
```

### 9.2 Piano Roll Data Model

The piano roll is the primary editor for MIDI clips. Its data model is a set of `MidiNote` objects within a clip's beat range.

```typescript
interface MidiClip extends BaseClip {
  notes: MidiNote[];
  controllerData: ControllerLane[];   // per-controller automation
  pitchBendData: AutomationPoint[];
  tempoOverride?: number;             // clip-specific tempo (Ableton)
  loopEnabled: boolean;
  loopStartBeats: number;
  loopEndBeats: number;
}

interface ControllerLane {
  controller: number;
  points: AutomationPoint[];
}
```

Piano roll viewport state mirrors the arrangement view but uses note pitch (MIDI note number) on the Y axis:

```typescript
interface PianoRollViewport {
  scrollBeats: number;
  pixelsPerBeat: number;
  scrollNote: number;     // MIDI note at top of viewport
  pixelsPerNote: number;  // typically 12-20 px per semitone
  canvasWidth: number;
  canvasHeight: number;
}
```

### 9.3 Quantization Algorithms

Quantization snaps note start times (and optionally durations) to a grid.

#### 9.3.1 Hard Quantize

```typescript
function quantizeNote(note: MidiNote, gridBeats: number, strength: number = 1.0): MidiNote {
  const snapped = Math.round(note.startBeats / gridBeats) * gridBeats;
  const newStart = note.startBeats + (snapped - note.startBeats) * strength;
  return { ...note, startBeats: newStart };
}
```

#### 9.3.2 Groove Quantize

Groove quantize uses a template (a "groove" extracted from a drum loop or predefined grid) to impose a rhythmic feel. Each note is snapped to the nearest groove grid point:

```typescript
interface GrooveTemplate {
  gridBeats: number;           // base grid size
  offsets: Float32Array;       // per-subdivision timing offsets in beats
  velocities: Float32Array;    // per-subdivision velocity scaling
}

function grooveQuantize(note: MidiNote, groove: GrooveTemplate, strength: number): MidiNote {
  const subdivIndex = Math.round(note.startBeats / groove.gridBeats) % groove.offsets.length;
  const targetBeat = Math.round(note.startBeats / groove.gridBeats) * groove.gridBeats
    + groove.offsets[subdivIndex];
  const newStart = note.startBeats + (targetBeat - note.startBeats) * strength;
  const newVelocity = note.velocity * (1 + (groove.velocities[subdivIndex] - 1) * strength);
  return { ...note, startBeats: newStart, velocity: Math.round(newVelocity) };
}
```

**Ableton Live** supports extracting groove from any audio clip (extracting its transient timing). **Logic Pro** has built-in groove templates ("Swing", "Shuffle") and supports importing MIDI as a groove. **Reaper** has quantize-to-groove via scripts.

### 9.4 MIDI Recording with Latency Compensation

MIDI input events arrive from the system MIDI stack with a timestamp. This timestamp must be corrected for:

1. **Input latency**: time between key press and the event reaching the DAW
2. **Output latency**: time between audio engine processing and reaching speakers

The total latency is `inputLatency + outputLatency`. When recording, subtract this from the event timestamp to get the corrected musical position:

```typescript
function correctMidiEventLatency(
  event: MidiEvent,
  audioContext: AudioContext,
  inputLatencySeconds: number
): number {
  // event.timestamp is DOMHighResTimeStamp from Web MIDI API
  const eventAudioTime = event.timestamp / 1000 - audioContext.baseLatency - inputLatencySeconds;
  const outputLatency = audioContext.outputLatency;
  const correctedAudioTime = eventAudioTime - outputLatency;
  return audioContextTimeToBeats(correctedAudioTime, tempoMap);
}
```

**Ableton Live** pioneered "Low Latency Monitoring" which uses the ASIO driver's reported latency for precise compensation. **Logic Pro** uses Core Audio's reported latency. Browser DAWs use `AudioContext.baseLatency` and `AudioContext.outputLatency` (both available in modern browsers).

### 9.5 MIDI Clip Recording Pipeline

```
Web MIDI API input event
  → timestamp correction (latency compensation)
  → beat position calculation
  → note-on: create NoteOn record with openNoteMap[note] = { id, startBeats, velocity }
  → note-off: close note from openNoteMap, compute durationBeats, add MidiNote to clip
  → real-time UI update (show notes appearing in piano roll)
```

The `openNoteMap` handles the case where note-on and note-off are processed in separate audio callbacks.

---

## 10. Comparative Synthesis

### 10.1 Architectural Comparison Table

| Dimension | Ableton Live 12 | Logic Pro 11 | Reaper 7 | Browser DAW (Web) |
|---|---|---|---|---|
| **Primary time unit** | Beats (float64) | Ticks (480 PPQN) | Samples + beats | Beats (float64) |
| **Clip model** | Clip with no takes | Region (take stacks) | Item + N takes | AudioClip (see §4.1) |
| **Undo model** | State snapshot delta | Command (forward/inverse) | Command (forward/inverse) | Immer snapshots |
| **Routing model** | Fixed track types | Flexible aux routing | Any-to-any matrix | Graph with typed edges |
| **Solo model** | SIP | SIP + Implicit | SIP + AFL/PFL | SIP (configurable) |
| **Automation** | Envelope segments | Hyper Draw regions | Per-point per-segment | Breakpoint lanes |
| **MIDI quantize** | Groove extraction | Logic groove templates | Script-based | Hard + groove |
| **Session format** | Binary (.als = ZIP + XML) | Package directory (.logicx) | RPP (text, key-value) | JSON |
| **Auto-save** | Yes (30s) | Yes (30s crash recovery) | Undo history backup | IndexedDB |
| **VCA groups** | No | Yes | Yes | Implementation choice |
| **Sidechain** | Post-fader only | Pre/post selectable | Any tap point | AudioWorklet custom |

### 10.2 Transport System Trade-offs

| Approach | Accuracy | Complexity | Flexibility |
|---|---|---|---|
| Fixed BPM only | Sample-exact | Low | Low (no tempo changes) |
| Tempo map (constant segments) | Sample-exact | Medium | High |
| Linear tempo ramps | Sub-sample error (float) | Medium-high | Very high |
| Beat-clock (no absolute sample) | Beat-accurate | Low | Medium |

For a browser DAW, a tempo map with constant-BPM segments is the correct starting point. Linear ramps add significant complexity and are needed only for expressive tempo automation.

### 10.3 Undo/Redo Strategy Trade-offs

| Strategy | Memory | Implementation complexity | Correctness risk |
|---|---|---|---|
| Full state snapshots | O(N * history_depth) | Low | Low |
| Structural sharing (Immer) | O(delta * history_depth) | Low-medium | Low |
| Forward/inverse commands | O(delta * history_depth) | High | Medium (inverse bugs) |
| CRDT-based | O(operations) | Very high | Low |

For a browser DAW, Immer with structural sharing is the pragmatic choice: React and TypeScript make the immutable state model natural, the overhead is acceptable for sessions up to ~10,000 clips, and the implementation is far simpler than maintaining correct inverse operations for every edit type.

### 10.4 Signal Routing Graph Trade-offs

| Model | Flexibility | Complexity | Cycle detection |
|---|---|---|---|
| Fixed track type hierarchy | Low | Low | Impossible by design |
| Soft-typed routing (Reaper) | Maximum | High | Required at every connection |
| Summing stacks (Logic) | Medium | Medium | Required |
| Any-to-any with type checks | High | Medium-high | Required |

---

## 11. Open Problems and Unsolved Challenges

### 11.1 Web Audio Timing Precision

The Web Audio API's `AudioContext.currentTime` has been documented to have jitter on certain platforms (Android Chrome, Safari on lower-powered devices). For a production browser DAW, this requires:

- Testing on all target platforms
- Fallback to `performance.now()` for scheduling with appropriate fudge factor
- Using `AudioWorkletProcessor` for truly sample-accurate scheduling rather than relying on `currentTime`

### 11.2 Multi-Track Recording Synchronization

Recording multiple tracks simultaneously requires that all input streams (from the same `MediaStream` source) are sample-aligned. The Web Audio API provides no guarantee of alignment between separate `MediaStreamAudioSourceNode` instances connected to the same `AudioContext`. This is a known limitation for browser-based multi-track recording.

### 11.3 Plugin (Audio Worklet) Latency Compensation

When a plugin (AudioWorkletNode) introduces lookahead processing (e.g., a look-ahead compressor), the DAW must delay all other tracks by the same amount to maintain alignment. This **plugin latency compensation (PDC)** is a complex graph-level problem:

- Reaper and Logic Pro implement automatic PDC
- Ableton Live has manual PDC per plugin
- Web Audio has no native PDC mechanism; it must be implemented in the routing layer by inserting `DelayNode` instances with the correct delay value

### 11.4 Large Session Performance

At 200+ tracks with complex routing, the JavaScript audio graph management overhead can become a bottleneck. Options include:

- Moving graph traversal to an `AudioWorkletProcessor` (runs off main thread)
- Using SharedArrayBuffer to share state between main thread and audio worklet
- Compiling the graph to a flat series of operations (like LLVM IR) for the worklet

### 11.5 Offline Rendering (Bounce/Export)

Web Audio's `OfflineAudioContext` enables offline rendering at faster-than-real-time. However, `AudioWorklet` processors do not run in `OfflineAudioContext` in all browsers (historically a WebKit limitation). This means custom processing that relies on AudioWorklet may not be usable for offline bounce.

### 11.6 MIDI 2.0

The MIDI 2.0 standard (ratified 2020) introduces:

- 32-bit resolution for controllers (vs 7-bit in MIDI 1.0)
- Per-note controllers
- Bidirectional property exchange (MIDI-CI)

Web MIDI API currently exposes MIDI 1.0 only. MIDI 2.0 browser support is not yet standardized. A DAW designed today should use 32-bit internal precision for controller data and render down to MIDI 1.0 for output.

---

## 12. Implementation Recommendations for Browser DAW

This section distills the survey into concrete architectural recommendations for a React + TypeScript + Web Audio API DAW.

### 12.1 State Architecture

Use a single immutable session state object with Immer:

```typescript
// store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type SessionStore = {
  session: Session;
  past: Session[];
  future: Session[];
  dispatch: (command: Command<Session>) => void;
  undo: () => void;
  redo: () => void;
};
```

### 12.2 Audio Engine Separation

Keep the audio engine (`AudioContext`, `AudioWorklet`, all `AudioNode` instances) completely separate from React state. Use a singleton `AudioEngine` class that:

- Subscribes to session state changes via a diffing subscription
- Updates the audio graph in response to structural changes (track add/remove, routing changes)
- Exposes a `getPlayheadBeats(audioCtx: AudioContext): number` method for cursor rendering
- Communicates recording events to the React layer via a message queue, not direct state mutation

### 12.3 Transport Hook

```typescript
// useTransport.ts
function useTransport(): TransportControls {
  const audioEngine = useAudioEngine();
  const { session, dispatch } = useSessionStore();

  return {
    play: () => audioEngine.play(),
    stop: () => audioEngine.stop(),
    record: () => audioEngine.record(),
    seek: (beats: number) => audioEngine.seek(beats),
    setTempo: (bpm: number) => dispatch(new SetTempoCommand(bpm)),
    playheadBeats: usePlayheadBeats(audioEngine),  // animated float64
  };
}
```

### 12.4 Clip Rendering

Use `<canvas>` for the arrangement view rather than DOM elements for clips. At 1000 clips, DOM-based rendering produces layout thrashing and paint overhead that the canvas approach avoids entirely.

For waveform rendering, pre-compute peak/RMS data at multiple resolution levels (peak pyramids) during audio file import:

```typescript
interface WaveformData {
  sampleRate: number;
  levels: WaveformLevel[];  // level[0] = 1 sample/pixel at 1:1 zoom, level[n] = 2^n samples/pixel
}

interface WaveformLevel {
  peaks: Float32Array;   // max abs sample per pixel-bucket
  rms: Float32Array;     // RMS per pixel-bucket
}
```

This approach (used by all three DAWs) enables O(1) waveform rendering at any zoom level.

---

## 13. Conclusion

DAW architecture represents a mature set of engineering patterns accumulated over four decades of commercial development. The core patterns — tempo maps for beat/sample conversion, the command pattern for invertible edits, the audio graph for signal routing, and immutable session data for serialization — are well-understood and have clear implementations in TypeScript and the Web Audio API.

The primary challenges for browser-based DAWs are not algorithmic but environmental: Web Audio timing jitter, multi-track recording synchronization, plugin delay compensation, and offline rendering coverage. Each has known workarounds (AudioWorkletProcessor scheduling, OfflineAudioContext with careful plugin selection, manual PDC configuration) that are acceptable for an initial implementation.

The reference architecture synthesized in this survey — Immer-based immutable session state, command pattern undo/redo, AudioWorklet-based render engine, canvas arrangement view with peak pyramids, and JSON session format with relative media pool paths — is the pragmatic path to a production-quality browser DAW.

---

## References

1. Vercoe, B. & Ellis, D. (1990). *Real-time csound: Software Synthesis with Sensing and Control*. ICMC Proceedings.
2. Moore, F.R. (1990). *Elements of Computer Music*. Prentice Hall. [Foundational audio graph model]
3. Roads, C. (1996). *The Computer Music Tutorial*. MIT Press.
4. Zölzer, U. (2011). *DAFX: Digital Audio Effects* (2nd ed.). Wiley. [DSP algorithms for DAW effects]
5. Farnell, A. (2010). *Designing Sound*. MIT Press. [Synthesis and signal flow]
6. Ableton AG. (2024). *Ableton Live 12 Manual*. https://www.ableton.com/en/manual/welcome-to-live/
7. Apple Inc. (2024). *Logic Pro User Guide*. https://support.apple.com/guide/logicpro/welcome/mac
8. Cockos Inc. (2024). *REAPER User Guide*. https://www.reaper.fm/userguide.php
9. W3C Audio Working Group. (2023). *Web Audio API Specification*. https://www.w3.org/TR/webaudio/
10. W3C. (2019). *Web MIDI API*. https://webaudio.github.io/web-midi-api/
11. MMA (MIDI Manufacturers Association). (2020). *MIDI 2.0 Specification*. https://www.midi.org/specifications/midi-2-0-specs
12. ITU-R. (2015). *BS.1770-4: Algorithms to measure audio programme loudness and true-peak audio level*. ITU-R Recommendation. https://www.itu.int/rec/R-REC-BS.1770/en
13. Tone.js Contributors. (2024). *Tone.js — A Web Audio framework for creating interactive music in the browser*. https://tonejs.github.io/
14. WAM Working Group. (2021). *Web Audio Modules 2.0 Specification*. https://www.webaudiomodules.org/
15. Buffa, M., Lebrun, J. et al. (2022). *Web Audio Modules 2.0, an Open Web Platform for Audio Plugins*. In Proceedings of the Web Conference 2022. https://dl.acm.org/doi/10.1145/3485447.3512199
16. Schlessinger, J. (2020). *MIDI and the Changing Technological Imaginary of Music*. Journal of the Society for American Music.
17. Gamma, E., Helm, R., Johnson, R., Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley. [Command pattern, §4.4]
18. Nishanov, G. (2019). *Lock-free programming patterns for real-time audio*. ADC 2019 (Audio Developers Conference). https://audio.dev/
19. Henriksson, T. (2016). *The DAW as a compositional tool: From sketch to finished product*. Luleå University of Technology.
20. Collins, N. (2010). *Introduction to Computer Music*. Wiley.

---

## Practitioner Resources

| Resource | Type | URL |
|---|---|---|
| Web Audio API Spec | Specification | https://www.w3.org/TR/webaudio/ |
| Tone.js | Library | https://tonejs.github.io/ |
| WAM 2.0 | Standard + SDK | https://www.webaudiomodules.org/ |
| JUCE C++ framework | Reference implementation | https://juce.com/ |
| Ardour (open source DAW) | Source code reference | https://github.com/Ardour/ardour |
| Basic Pitch (Spotify) | MIDI transcription | https://github.com/spotify/basic-pitch |
| Meyda.js | Feature extraction | https://meyda.js.org/ |
| Peak.js | Waveform rendering | https://github.com/bbc/peaks.js |
| Wavesurfer.js | Waveform + regions | https://wavesurfer.xyz/ |
| OfflineAudioContext MDN | Docs | https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext |
| AudioWorklet explainer | Docs | https://developer.chrome.com/blog/audio-worklet/ |
| Web MIDI API MDN | Docs | https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API |
| Ableton Link SDK | SDK | https://github.com/Ableton/link |
| loudness-meter (npm) | Library | https://www.npmjs.com/package/loudness-meter |
| Immer (npm) | Library | https://immerjs.github.io/immer/ |
