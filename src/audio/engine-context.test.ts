import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAudioEngine, type AudioEngineContext } from "./engine-context";

class MockAudioContext {
  state: AudioContextState = "suspended";
  readonly audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = "closed";
    return Promise.resolve();
  }
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", MockAudioContext);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createAudioEngine", () => {
  let engine: AudioEngineContext;

  beforeEach(() => {
    engine = createAudioEngine();
  });

  it("creates engine in suspended state", () => {
    expect(engine.state).toBe("suspended");
  });

  it("provides access to the AudioContext", () => {
    expect(engine.ctx).toBeDefined();
  });

  it("resumes the AudioContext", async () => {
    await engine.resume();
    expect(engine.state).toBe("running");
  });

  it("resume is idempotent when already running", async () => {
    await engine.resume();
    await engine.resume();
    expect(engine.state).toBe("running");
  });

  it("closes the AudioContext", async () => {
    await engine.close();
    expect(engine.state).toBe("closed");
  });

  it("close is idempotent when already closed", async () => {
    await engine.close();
    await engine.close();
    expect(engine.state).toBe("closed");
  });

  it("loads an AudioWorklet module", async () => {
    await engine.loadWorkletModule("/worklet.js");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(engine.ctx.audioWorklet.addModule).toHaveBeenCalledWith(
      "/worklet.js",
    );
  });

  it("wraps resume() rejection with a descriptive AudioEngineError", async () => {
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        override resume(): Promise<void> {
          return Promise.reject(new Error("autoplay policy"));
        }
      },
    );
    const failEngine = createAudioEngine();
    await expect(failEngine.resume()).rejects.toThrow(
      /audio playback was blocked/i,
    );
  });

  it("wraps loadWorkletModule() rejection with a descriptive AudioEngineError", async () => {
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        override readonly audioWorklet = {
          addModule: vi.fn().mockRejectedValue(new Error("network error")),
        };
      },
    );
    const failEngine = createAudioEngine();
    await expect(failEngine.loadWorkletModule("/bad.js")).rejects.toThrow(
      /failed to load audio worklet/i,
    );
  });

  it("throws AudioEngineError when AudioContext constructor fails", () => {
    vi.stubGlobal("AudioContext", function FailingAudioContext() {
      throw new Error("Web Audio not supported");
    });
    expect(() => createAudioEngine()).toThrow(/audio context/i);
  });

  it("AudioEngineError includes the original cause", async () => {
    const original = new Error("the root cause");
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        override resume(): Promise<void> {
          return Promise.reject(original);
        }
      },
    );
    const failEngine = createAudioEngine();
    try {
      await failEngine.resume();
      expect.fail("should have thrown");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).cause).toBe(original);
    }
  });
});
