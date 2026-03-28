/**
 * SynthInstrument: main-thread controller for the synth AudioWorklet.
 * Creates AudioWorkletNode, sends voice commands, manages parameters,
 * connects output to mixer channel strip.
 *
 * R-EVT-08: Real-time parameter changes via MessagePort.
 */

import type { SynthVoiceCommand, SynthParameterMap } from "./synth-types";
import {
  DEFAULT_SYNTH_PARAMS,
  WAVEFORM_TYPES,
  FILTER_TYPES,
  LFO_SHAPES,
} from "./synth-types";
import type { MixerEngine } from "@audio/mixer/types";
import type { WorkletModRoute } from "./modulation-engine";

export type SynthInstrument = {
  /** The audio output node — connect to mixer channel strip. */
  readonly output: AudioNode;
  /** Current parameter values. */
  readonly params: Readonly<SynthParameterMap>;
  /** Send a note-on to the synth. */
  noteOn(note: number, velocity: number, legato?: boolean): void;
  /** Send a note-off to the synth. */
  noteOff(note: number): void;
  /** Release all notes. */
  allNotesOff(): void;
  /** Set a synth parameter (forwarded to worklet). */
  setParam<K extends keyof SynthParameterMap>(
    key: K,
    value: SynthParameterMap[K],
  ): void;
  /** Send modulation routes to the worklet. */
  setModRoutes(routes: WorkletModRoute[]): void;
  /** Set a modulation source value (aftertouch, modWheel, pitchBend). */
  setModSource(source: string, value: number): void;
  /** Connect to a mixer channel. */
  connectToMixer(mixer: MixerEngine, trackId: string): void;
  /** Disconnect from mixer. */
  disconnectFromMixer(mixer: MixerEngine, trackId: string): void;
  /** Clean up all resources. */
  dispose(): void;
};

/** URL for the worklet processor module */
const PROCESSOR_URL = new URL("./synth-processor.ts", import.meta.url);

/**
 * Create a SynthInstrument connected to the given AudioContext.
 * Must call `audioCtx.audioWorklet.addModule()` first via loadWorkletModule().
 */
export async function createSynthInstrument(
  ctx: AudioContext,
): Promise<SynthInstrument> {
  // Load the worklet module
  await ctx.audioWorklet.addModule(PROCESSOR_URL.href);

  const node = new AudioWorkletNode(ctx, "synth-processor", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });

  const params: SynthParameterMap = { ...DEFAULT_SYNTH_PARAMS };

  function postCommand(cmd: SynthVoiceCommand): void {
    node.port.postMessage(cmd);
  }

  const instrument: SynthInstrument = {
    output: node,
    params,

    noteOn(note: number, velocity: number, legato = false): void {
      postCommand({ type: "noteOn", note, velocity, legato });
    },

    noteOff(note: number): void {
      postCommand({ type: "noteOff", note });
    },

    allNotesOff(): void {
      postCommand({ type: "allNotesOff" });
    },

    setParam<K extends keyof SynthParameterMap>(
      key: K,
      value: SynthParameterMap[K],
    ): void {
      (params as Record<string, unknown>)[key] = value;

      // Map enum types to numeric index for the worklet
      let numericValue: number;
      if (typeof value === "string") {
        // Lookup string in appropriate type array
        switch (key) {
          case "osc1Type":
          case "osc2Type":
            numericValue = WAVEFORM_TYPES.indexOf(
              value as (typeof WAVEFORM_TYPES)[number],
            );
            break;
          case "filterType":
            numericValue = FILTER_TYPES.indexOf(
              value as (typeof FILTER_TYPES)[number],
            );
            break;
          case "lfo1Shape":
          case "lfo2Shape":
            numericValue = LFO_SHAPES.indexOf(
              value as (typeof LFO_SHAPES)[number],
            );
            break;
          default:
            numericValue = 0;
        }
      } else {
        numericValue = value;
      }

      postCommand({
        type: "setParam",
        key: key as string,
        value: numericValue,
      });
    },

    setModRoutes(routes: WorkletModRoute[]): void {
      postCommand({ type: "setModRoutes", routes });
    },

    setModSource(source: string, value: number): void {
      postCommand({ type: "setModSource", source, value });
    },

    connectToMixer(mixer: MixerEngine, trackId: string): void {
      const strip = mixer.getOrCreateStrip(trackId);
      node.connect(strip.inputGain);
    },

    disconnectFromMixer(_mixer: MixerEngine, _trackId: string): void {
      node.disconnect();
    },

    dispose(): void {
      node.disconnect();
      node.port.close();
    },
  };

  return instrument;
}
