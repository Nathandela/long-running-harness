/**
 * Types for the mixer audio engine.
 * Channel strips, master bus, insert chain infrastructure.
 */

export type InsertSlot = {
  readonly id: string;
  readonly node: AudioNode | null; // null = empty slot
  readonly bypassed: boolean;
};

export type ChannelStrip = {
  readonly trackId: string;
  /** Pre-insert input gain */
  readonly inputGain: GainNode;
  /** Ordered insert chain (empty initially) */
  readonly inserts: readonly InsertSlot[];
  /** Post-insert fader (logarithmic taper via GainNode) */
  readonly faderGain: GainNode;
  /** Stereo panner */
  readonly panner: StereoPannerNode;
  /** Mute control (gain 0 or 1) */
  readonly muteGain: GainNode;
  /** AnalyserNode for metering */
  readonly analyser: AnalyserNode;
  /** Whether this channel is muted */
  muted: boolean;
  /** Whether this channel is soloed */
  solo: boolean;
  /** Whether this channel has solo-isolate enabled */
  soloIsolate: boolean;
};

export type MasterBus = {
  /** Sum input from all channel strips */
  readonly inputGain: GainNode;
  /** Master fader */
  readonly faderGain: GainNode;
  /**
   * INV-2: Non-bypassable brickwall limiter.
   * DynamicsCompressorNode: threshold=-1dBFS, ratio=20:1, knee=0,
   * attack=0.001s, release=0.01s
   */
  readonly limiter: DynamicsCompressorNode;
  /** Master analyser for metering */
  readonly analyser: AnalyserNode;
};

export type MixerEngine = {
  /** Get or create a channel strip for a track */
  getOrCreateStrip(trackId: string): ChannelStrip;
  /** Remove a channel strip */
  removeStrip(trackId: string): void;
  /** Get an existing strip */
  getStrip(trackId: string): ChannelStrip | undefined;
  /** Get all channel strips */
  getAllStrips(): readonly ChannelStrip[];
  /** Get master bus */
  getMaster(): MasterBus;

  /** Set fader level (0..2, logarithmic taper applied internally) */
  setFaderLevel(trackId: string, level: number): void;
  /** Set pan (-1..1) */
  setPan(trackId: string, pan: number): void;
  /** Set mute state */
  setMute(trackId: string, muted: boolean): void;
  /** Set solo state */
  setSolo(trackId: string, solo: boolean): void;
  /** Set solo-isolate state */
  setSoloIsolate(trackId: string, enabled: boolean): void;
  /** Set master fader level */
  setMasterLevel(level: number): void;

  /** Recompute mute states based on solo-in-place logic */
  updateSoloState(): void;

  /** Get the output node to connect sources to for a track */
  getTrackInput(trackId: string): AudioNode;

  /** Emergency mute master */
  emergencyMute(): void;
  /** Release emergency mute */
  releaseEmergencyMute(): void;

  /** Dispose all nodes */
  dispose(): void;
};
