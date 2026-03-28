/**
 * Tests for synth-processor message handling.
 * Mocks AudioWorklet globals to test setModRoutes/setModSource
 * without a real AudioWorklet context.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
} from "vitest";
import type { SynthVoiceCommand } from "./synth-types";

// Mock AudioWorklet globals before importing processor
let processorInstance: InstanceType<typeof MockProcessor>;
let portHandler: ((e: MessageEvent) => void) | null = null;

class MockProcessor {
  port = {
    onmessage: null as ((e: MessageEvent) => void) | null,
    postMessage: vi.fn(),
    close: vi.fn(),
  };
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    processorInstance = this;
  }
}

// Save originals for restore
const savedAWP = (globalThis as Record<string, unknown>).AudioWorkletProcessor;
const savedRP = (globalThis as Record<string, unknown>).registerProcessor;
const savedSR = (globalThis as Record<string, unknown>).sampleRate;

let registeredCtor: (new () => MockProcessor) | null = null;

(globalThis as Record<string, unknown>).sampleRate = 44100;
(globalThis as Record<string, unknown>).AudioWorkletProcessor = MockProcessor;
(globalThis as Record<string, unknown>).registerProcessor = (
  _name: string,
  ctor: new () => MockProcessor,
) => {
  registeredCtor = ctor;
};

describe("SynthProcessor message handling", () => {
  beforeEach(async () => {
    registeredCtor = null;
    // Dynamic import to trigger registerProcessor
    await import("./synth-processor");
    expect(registeredCtor).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    new registeredCtor!();
    portHandler = processorInstance.port.onmessage;
  });

  afterEach(() => {
    vi.resetModules();
  });

  function sendMessage(cmd: SynthVoiceCommand): void {
    portHandler?.({ data: cmd } as MessageEvent);
  }

  it("accepts setModRoutes command without error", () => {
    expect(() => {
      sendMessage({
        type: "setModRoutes",
        routes: [
          { sourceIdx: 0, destIdx: 3, amount: 0.5, bipolar: true },
          { sourceIdx: 1, destIdx: 0, amount: -0.3, bipolar: false },
        ],
      });
    }).not.toThrow();
  });

  it("accepts setModSource command without error", () => {
    expect(() => {
      sendMessage({
        type: "setModSource",
        source: "aftertouch",
        value: 0.7,
      });
    }).not.toThrow();
  });

  it("accepts setModSource for all global sources", () => {
    for (const source of ["aftertouch", "modWheel", "pitchBend"] as const) {
      expect(() => {
        sendMessage({
          type: "setModSource",
          source,
          value: 0.5,
        });
      }).not.toThrow();
    }
  });

  it("handles setModRoutes with empty routes array", () => {
    expect(() => {
      sendMessage({ type: "setModRoutes", routes: [] });
    }).not.toThrow();
  });
});

// Restore globals
afterAll(() => {
  (globalThis as Record<string, unknown>).AudioWorkletProcessor = savedAWP;
  (globalThis as Record<string, unknown>).registerProcessor = savedRP;
  (globalThis as Record<string, unknown>).sampleRate = savedSR;
});
