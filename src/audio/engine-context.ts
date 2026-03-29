/**
 * AudioContext lifecycle management.
 * Handles creation, suspension, resumption on user gesture,
 * and AudioWorklet module loading.
 */

export class AudioEngineError extends Error {
  constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = "AudioEngineError";
  }
}

export type AudioEngineState =
  | "uninitialized"
  | "suspended"
  | "running"
  | "closed";

export type AudioEngineContext = {
  readonly ctx: AudioContext;
  readonly state: AudioEngineState;
  resume: () => Promise<void>;
  close: () => Promise<void>;
  loadWorkletModule: (url: string) => Promise<void>;
};

/**
 * Creates an AudioContext in suspended state.
 * Call resume() after a user gesture to start audio.
 */
export function createAudioEngine(): AudioEngineContext {
  const ctx = new AudioContext();

  const engine: AudioEngineContext = {
    ctx,
    get state(): AudioEngineState {
      switch (ctx.state) {
        case "suspended":
          return "suspended";
        case "running":
          return "running";
        case "closed":
          return "closed";
        default:
          return "uninitialized";
      }
    },
    async resume(): Promise<void> {
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch (err) {
          throw new AudioEngineError(
            "Audio playback was blocked by the browser. Click the page and try again.",
            err,
          );
        }
      }
    },
    async close(): Promise<void> {
      if (ctx.state !== "closed") {
        await ctx.close();
      }
    },
    async loadWorkletModule(url: string): Promise<void> {
      try {
        await ctx.audioWorklet.addModule(url);
      } catch (err) {
        throw new AudioEngineError(
          `Failed to load audio worklet module "${url}". Check your network connection and reload.`,
          err,
        );
      }
    },
  };

  return engine;
}
