/**
 * AudioContext lifecycle management.
 * Handles creation, suspension, resumption on user gesture,
 * and AudioWorklet module loading.
 */

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
        await ctx.resume();
      }
    },
    async close(): Promise<void> {
      if (ctx.state !== "closed") {
        await ctx.close();
      }
    },
    async loadWorkletModule(url: string): Promise<void> {
      await ctx.audioWorklet.addModule(url);
    },
  };

  return engine;
}
