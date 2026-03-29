/**
 * Bounce/export engine: offline rendering of the session to WAV.
 *
 * Renders the full audio graph in an OfflineAudioContext:
 * - Mixer channel strips + master bus + brickwall limiter
 * - Audio clip scheduling
 * - Pre-rendered synth MIDI clips
 * - Drum machine triggers
 * - Automation curves
 *
 * Cooperative cancellation via internal flag.
 * Progress reporting via async generator.
 *
 * EARS: R-EVT-14, NFR-17
 */

import type {
  AudioClipModel,
  MidiClipModel,
  TrackModel,
  ClipModel,
} from "@state/track/types";
import { isAudioClip, isMidiClip } from "@state/track/types";
import type {
  BounceEngine,
  BounceOptions,
  BounceProgress,
  BounceResult,
  TrackInstrumentConfig,
} from "./types";
import type { AutomationLane } from "@audio/automation/automation-types";
import type { DrumInstrumentId } from "@audio/drum-machine/drum-types";
import {
  evaluateCurve,
  denormalize,
  findPointsInRange,
} from "@audio/automation/automation-curve";
import { faderTaper } from "@audio/mixer/fader-taper";
import { renderMidiClipToAudio } from "./synth-renderer";
import { encodeWavHeader, encodePcmChunk, assembleWav } from "./wav-encoder";

// ─── Session analysis (exported for testing) ───

export type SessionBounds = {
  readonly start: number;
  readonly end: number;
};

/** Determine which tracks are audible given mute/solo state */
function getAudibleTrackIds(tracks: readonly TrackModel[]): Set<string> {
  const hasSolo = tracks.some((t) => t.solo);
  const audible = new Set<string>();

  for (const track of tracks) {
    if (track.muted) continue;
    if (hasSolo && !track.solo && !track.soloIsolate) continue;
    audible.add(track.id);
  }

  return audible;
}

/** Compute the time bounds of all audible clips in the session */
export function computeSessionBounds(
  tracks: readonly TrackModel[],
  clips: Readonly<Record<string, ClipModel>>,
): SessionBounds {
  const audible = getAudibleTrackIds(tracks);
  let start = Infinity;
  let end = 0;

  for (const track of tracks) {
    if (!audible.has(track.id)) continue;
    for (const clipId of track.clipIds) {
      const clip = clips[clipId];
      if (!clip) continue;
      start = Math.min(start, clip.startTime);
      end = Math.max(end, clip.startTime + clip.duration);
    }
  }

  if (start === Infinity) start = 0;
  return { start, end };
}

// ─── Event timeline (exported for testing) ───

export type TimelineAudioClip = {
  readonly clip: AudioClipModel;
  readonly trackId: string;
};

export type TimelineMidiClip = {
  readonly clip: MidiClipModel;
  readonly trackId: string;
};

export type EventTimeline = {
  readonly audioClips: readonly TimelineAudioClip[];
  readonly midiClips: readonly TimelineMidiClip[];
};

/** Build a timeline of events for audible tracks */
export function buildEventTimeline(
  tracks: readonly TrackModel[],
  clips: Readonly<Record<string, ClipModel>>,
): EventTimeline {
  const audible = getAudibleTrackIds(tracks);
  const audioClips: TimelineAudioClip[] = [];
  const midiClips: TimelineMidiClip[] = [];

  for (const track of tracks) {
    if (!audible.has(track.id)) continue;
    for (const clipId of track.clipIds) {
      const clip = clips[clipId];
      if (!clip) continue;
      if (isAudioClip(clip)) {
        audioClips.push({ clip, trackId: track.id });
      } else if (isMidiClip(clip)) {
        midiClips.push({ clip, trackId: track.id });
      }
    }
  }

  return { audioClips, midiClips };
}

// ─── Offline mixer graph ───

type OfflineMixerStrip = {
  inputGain: GainNode;
  faderGain: GainNode;
  panner: StereoPannerNode;
  muteGain: GainNode;
};

type OfflineMixer = {
  strips: Map<string, OfflineMixerStrip>;
  masterInput: GainNode;
  masterFader: GainNode;
  limiter: DynamicsCompressorNode;
};

function buildOfflineMixer(
  ctx: OfflineAudioContext,
  tracks: readonly TrackModel[],
  masterLevel: number,
  audibleIds: Set<string>,
): OfflineMixer {
  // Master bus
  const masterInput = ctx.createGain();
  const masterFader = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();

  // INV-2: Brickwall limiter
  limiter.threshold.value = -1;
  limiter.ratio.value = 20;
  limiter.knee.value = 0;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.01;

  masterInput.connect(masterFader);
  masterFader.connect(limiter);
  limiter.connect(ctx.destination);
  masterFader.gain.value = masterLevel;

  // Channel strips
  const strips = new Map<string, OfflineMixerStrip>();
  for (const track of tracks) {
    if (!audibleIds.has(track.id)) continue;

    const inputGain = ctx.createGain();
    const faderGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const muteGain = ctx.createGain();

    inputGain.connect(faderGain);
    faderGain.connect(panner);
    panner.connect(muteGain);
    muteGain.connect(masterInput);

    faderGain.gain.value = faderTaper(track.volume);
    panner.pan.value = track.pan;
    muteGain.gain.value = 1; // Already filtered by audibleIds

    strips.set(track.id, { inputGain, faderGain, panner, muteGain });
  }

  return { strips, masterInput, masterFader, limiter };
}

// ─── Audio clip scheduling ───

function scheduleAudioClips(
  ctx: OfflineAudioContext,
  audioClips: readonly TimelineAudioClip[],
  mixer: OfflineMixer,
  rangeStart: number,
  getBuffer: (sourceId: string) => AudioBuffer | undefined,
): void {
  for (const { clip, trackId } of audioClips) {
    const strip = mixer.strips.get(trackId);
    if (!strip) continue;

    const buffer = getBuffer(clip.sourceId);
    if (!buffer) continue;

    // Compute timing relative to range start
    const clipStart = clip.startTime - rangeStart;
    const clipEnd = clipStart + clip.duration;

    // Skip if clip is entirely before the render window
    if (clipEnd <= 0) continue;

    // Handle clips that start before the render window
    const seekOffset = clipStart < 0 ? -clipStart : 0;
    const sourceOffset = clip.sourceOffset + seekOffset;
    const playDuration = clip.duration - seekOffset;
    const playStart = Math.max(0, clipStart);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = clip.gain;

    // Apply fades, accounting for seek offset
    const maxFadeIn = Math.min(clip.fadeIn, clip.duration);
    const maxFadeOut = Math.min(clip.fadeOut, clip.duration - maxFadeIn);

    // Fade-in: skip or shorten if we're seeking past it
    if (maxFadeIn > 0 && seekOffset < maxFadeIn) {
      const fadeInRemaining = maxFadeIn - seekOffset;
      const startGain =
        seekOffset > 0 ? (seekOffset / maxFadeIn) * clip.gain : 0;
      gainNode.gain.setValueAtTime(startGain, playStart);
      gainNode.gain.linearRampToValueAtTime(
        clip.gain,
        playStart + fadeInRemaining,
      );
    }

    if (maxFadeOut > 0) {
      const fadeOutStart = clipEnd - maxFadeOut;
      gainNode.gain.setValueAtTime(clip.gain, Math.max(0, fadeOutStart));
      gainNode.gain.linearRampToValueAtTime(0, clipEnd);
    }

    source.connect(gainNode);
    gainNode.connect(strip.inputGain);
    source.start(playStart, sourceOffset, playDuration);
  }
}

// ─── MIDI pre-rendering ───

function scheduleMidiClips(
  ctx: OfflineAudioContext,
  midiClips: readonly TimelineMidiClip[],
  mixer: OfflineMixer,
  rangeStart: number,
  instruments: ReadonlyMap<string, TrackInstrumentConfig>,
): void {
  for (const { clip, trackId } of midiClips) {
    const strip = mixer.strips.get(trackId);
    if (!strip) continue;

    const config = instruments.get(trackId);
    if (!config || config.type !== "synth") continue;

    // Pre-render MIDI to audio using synth DSP
    const rendered = renderMidiClipToAudio(
      clip.noteEvents,
      clip.duration,
      ctx.sampleRate,
      config.params,
    );

    // Create AudioBuffer from rendered data
    const audioBuffer = ctx.createBuffer(
      2,
      rendered.left.length,
      ctx.sampleRate,
    );
    audioBuffer.copyToChannel(rendered.left, 0);
    audioBuffer.copyToChannel(rendered.right, 1);

    // Schedule playback
    const clipStart = clip.startTime - rangeStart;
    if (clipStart + clip.duration <= 0) continue;

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const seekOffset = clipStart < 0 ? -clipStart : 0;
    const playStart = Math.max(0, clipStart);

    source.connect(strip.inputGain);
    source.start(playStart, seekOffset, clip.duration - seekOffset);
  }
}

// ─── Drum scheduling ───

function scheduleDrumClips(
  ctx: OfflineAudioContext,
  midiClips: readonly TimelineMidiClip[],
  mixer: OfflineMixer,
  rangeStart: number,
  instruments: ReadonlyMap<string, TrackInstrumentConfig>,
): void {
  for (const { clip, trackId } of midiClips) {
    const strip = mixer.strips.get(trackId);
    if (!strip) continue;

    const config = instruments.get(trackId);
    if (!config || config.type !== "drums") continue;

    // Schedule individual drum hits
    for (const note of clip.noteEvents) {
      const hitTime = clip.startTime + note.startTime - rangeStart;
      const drumId = mapPitchToDrum(note.pitch);
      if (!drumId) continue;

      const sampleBuffer = config.samples.get(drumId);
      if (!sampleBuffer) continue;

      const drumParams = config.params.get(drumId);
      const decay = drumParams?.decay ?? 0.5;

      // Skip if the hit + its decay is entirely before the render window
      if (hitTime + decay <= 0) continue;

      const velocity = note.velocity / 127;
      const source = ctx.createBufferSource();
      source.buffer = sampleBuffer;

      // Handle hits that start before the render window (play tail only)
      const seekOffset = hitTime < 0 ? -hitTime : 0;
      const playStart = Math.max(0, hitTime);

      if (drumParams) {
        source.playbackRate.setValueAtTime(drumParams.tune, playStart);
      }

      const gain = ctx.createGain();
      const peakGain = Math.max(0.001, (drumParams?.volume ?? 1) * velocity);
      // Compute decayed gain at seek point
      const gainAtSeek =
        seekOffset > 0
          ? peakGain * Math.exp(-seekOffset / (decay * 0.3))
          : peakGain;
      gain.gain.setValueAtTime(Math.max(0.001, gainAtSeek), playStart);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + decay);

      source.connect(gain);
      gain.connect(strip.inputGain);
      source.start(playStart, seekOffset);
      source.stop(hitTime + decay + 0.01);
    }
  }
}

/** Simple MIDI pitch to drum ID mapping (GM drum map subset) */
function mapPitchToDrum(pitch: number): DrumInstrumentId | undefined {
  const map: Record<number, DrumInstrumentId> = {
    36: "bd",
    35: "bd",
    38: "sd",
    40: "sd",
    41: "lt",
    43: "lt",
    45: "mt",
    47: "mt",
    48: "ht",
    50: "ht",
    37: "rs",
    39: "cp",
    56: "cb",
    46: "oh",
    42: "ch",
    44: "ch",
    49: "cy",
    51: "cy",
  };
  return map[pitch];
}

// ─── Automation scheduling ───

function scheduleAutomation(
  ctx: OfflineAudioContext,
  lanes: readonly AutomationLane[],
  mixer: OfflineMixer,
  rangeStart: number,
  duration: number,
): void {
  for (const lane of lanes) {
    if (!lane.armed || lane.mode === "write" || lane.points.length === 0)
      continue;

    const strip = mixer.strips.get(lane.trackId);
    if (!strip) continue;

    // Resolve target parameter
    const resolved = resolveOfflineParam(lane, strip);
    if (!resolved) continue;

    const { param, range } = resolved;

    // Schedule automation for the full render duration
    const startNorm = evaluateCurve(lane.points, rangeStart);
    const startVal = denormalize(startNorm, range);
    param.setValueAtTime(startVal, 0);

    // Schedule breakpoints
    const innerPoints = findPointsInRange(
      lane.points,
      rangeStart,
      rangeStart + duration,
    );
    for (const pt of innerPoints) {
      const ctxTime = pt.time - rangeStart;
      const val = denormalize(pt.value, range);
      param.linearRampToValueAtTime(val, ctxTime);
    }

    // End value
    const endNorm = evaluateCurve(lane.points, rangeStart + duration);
    const endVal = denormalize(endNorm, range);
    param.linearRampToValueAtTime(endVal, duration);
  }
}

type ResolvedOfflineParam = {
  param: AudioParam;
  range: { min: number; max: number };
};

function resolveOfflineParam(
  lane: AutomationLane,
  strip: OfflineMixerStrip,
): ResolvedOfflineParam | undefined {
  if (lane.target.type !== "mixer") return undefined;

  switch (lane.target.param) {
    case "volume":
      return { param: strip.faderGain.gain, range: { min: 0, max: 2 } };
    case "pan":
      return { param: strip.panner.pan, range: { min: -1, max: 1 } };
  }
}

// ─── WAV encoding (chunked) ───

const WAV_CHUNK_SAMPLES = 30 * 44100; // ~30 seconds per encoding chunk

function encodeRenderedBuffer(
  buffer: AudioBuffer,
  bitDepth: 16 | 24 | 32,
): Blob {
  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const totalSamples = buffer.length;
  const sampleRate = buffer.sampleRate;

  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  const header = encodeWavHeader(
    numChannels,
    sampleRate,
    bitDepth,
    totalSamples,
  );
  const chunks: ArrayBuffer[] = [];

  // Encode in chunks for memory efficiency
  for (let offset = 0; offset < totalSamples; offset += WAV_CHUNK_SAMPLES) {
    const end = Math.min(offset + WAV_CHUNK_SAMPLES, totalSamples);
    const chunkChannels = channelData.map((ch) => ch.subarray(offset, end));
    chunks.push(encodePcmChunk(chunkChannels, bitDepth));
  }

  return assembleWav(header, chunks);
}

// ─── BounceEngine factory ───

type OfflineContextFactory = (
  duration: number,
  sampleRate: number,
) => OfflineAudioContext;

const defaultContextFactory: OfflineContextFactory = (duration, sampleRate) => {
  const length = Math.ceil(duration * sampleRate);
  return new OfflineAudioContext(2, length, sampleRate);
};

export function createBounceEngine(
  contextFactory: OfflineContextFactory = defaultContextFactory,
): BounceEngine {
  // Cancellation state — checked at yield/await suspension points
  let cancelFlag = false;
  // Indirection prevents the linter from proving the flag is always falsy
  // (it changes externally via cancel() between yield/await suspensions)
  function isCancelled(): boolean {
    return cancelFlag;
  }

  return {
    async *bounce(
      options: BounceOptions,
    ): AsyncGenerator<BounceProgress, BounceResult> {
      cancelFlag = false;
      const emptyResult: BounceResult = {
        blob: new Blob(),
        duration: 0,
        sampleRate: options.sampleRate,
        channels: 2,
      };

      // Phase: Preparing
      yield {
        phase: "preparing",
        progress: 0,
        renderedSeconds: 0,
        totalSeconds: 0,
      };

      if (isCancelled()) return emptyResult;

      // Determine render range
      const sessionBounds = computeSessionBounds(options.tracks, options.clips);
      let rangeStart: number;
      let rangeEnd: number;

      if (options.range.type === "region") {
        rangeStart = options.range.start;
        rangeEnd = options.range.end;
      } else {
        rangeStart = sessionBounds.start;
        rangeEnd = sessionBounds.end;
      }

      const duration = Math.max(0, rangeEnd - rangeStart);
      if (duration === 0) return emptyResult;

      // Build event timeline
      const timeline = buildEventTimeline(options.tracks, options.clips);
      const audibleIds = getAudibleTrackIds(options.tracks);

      // Phase: Rendering
      yield {
        phase: "rendering",
        progress: 0.1,
        renderedSeconds: 0,
        totalSeconds: duration,
      };

      // Create OfflineAudioContext
      const ctx = contextFactory(duration, options.sampleRate);

      // Build offline mixer graph
      const mixer = buildOfflineMixer(
        ctx,
        options.tracks,
        options.masterLevel,
        audibleIds,
      );

      // Schedule audio clips
      scheduleAudioClips(
        ctx,
        timeline.audioClips,
        mixer,
        rangeStart,
        options.getBuffer,
      );

      // Schedule MIDI clips (pre-rendered synth)
      scheduleMidiClips(
        ctx,
        timeline.midiClips,
        mixer,
        rangeStart,
        options.instruments,
      );

      // Schedule drum clips
      scheduleDrumClips(
        ctx,
        timeline.midiClips,
        mixer,
        rangeStart,
        options.instruments,
      );

      // Schedule automation
      scheduleAutomation(
        ctx,
        options.automationLanes,
        mixer,
        rangeStart,
        duration,
      );

      if (isCancelled()) return emptyResult;

      // Render
      const renderedBuffer = await ctx.startRendering();

      yield {
        phase: "rendering",
        progress: 0.7,
        renderedSeconds: duration,
        totalSeconds: duration,
      };

      if (isCancelled()) return emptyResult;

      // Phase: Encoding
      yield {
        phase: "encoding",
        progress: 0.8,
        renderedSeconds: duration,
        totalSeconds: duration,
      };

      const blob = encodeRenderedBuffer(renderedBuffer, options.bitDepth);

      yield {
        phase: "complete",
        progress: 1,
        renderedSeconds: duration,
        totalSeconds: duration,
      };

      return {
        blob,
        duration,
        sampleRate: options.sampleRate,
        channels: 2,
      };
    },

    cancel(): void {
      cancelFlag = true;
    },
  };
}
