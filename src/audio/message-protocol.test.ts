/* eslint-disable @typescript-eslint/unbound-method -- vi.fn() mocks are safe to reference unbound */
import { describe, it, expect, vi } from "vitest";
import {
  postEngineCommand,
  postEngineEvent,
  type EngineCommand,
  type EngineEvent,
} from "./message-protocol";

function createMockPort(): MessagePort {
  return {
    postMessage: vi.fn(),
    onmessage: null,
    onmessageerror: null,
    start: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

describe("postEngineCommand", () => {
  it("posts play command to port", () => {
    const port = createMockPort();
    const cmd: EngineCommand = { type: "play" };
    postEngineCommand(port, cmd);
    expect(port.postMessage).toHaveBeenCalledWith(cmd);
  });

  it("posts init command with shared buffers", () => {
    const port = createMockPort();
    const cmd: EngineCommand = {
      type: "init",
      sampleRate: 44100,
      sharedBuffers: {
        metering: new SharedArrayBuffer(16),
        transport: new SharedArrayBuffer(16),
      },
    };
    postEngineCommand(port, cmd);
    expect(port.postMessage).toHaveBeenCalledWith(cmd);
  });

  it("posts seek command with position", () => {
    const port = createMockPort();
    const cmd: EngineCommand = { type: "seek", positionSeconds: 2.5 };
    postEngineCommand(port, cmd);
    expect(port.postMessage).toHaveBeenCalledWith(cmd);
  });
});

describe("postEngineEvent", () => {
  it("posts ready event", () => {
    const port = createMockPort();
    const evt: EngineEvent = { type: "ready" };
    postEngineEvent(port, evt);
    expect(port.postMessage).toHaveBeenCalledWith(evt);
  });

  it("posts error event with message", () => {
    const port = createMockPort();
    const evt: EngineEvent = { type: "error", message: "worklet failed" };
    postEngineEvent(port, evt);
    expect(port.postMessage).toHaveBeenCalledWith(evt);
  });
});
