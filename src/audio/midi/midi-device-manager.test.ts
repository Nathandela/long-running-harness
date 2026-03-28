import { describe, it, expect, beforeEach } from "vitest";
import { createMidiDeviceManager } from "./midi-device-manager";
import type { MidiDeviceManager } from "./midi-device-manager";

describe("createMidiDeviceManager", () => {
  let manager: MidiDeviceManager;

  beforeEach(() => {
    manager = createMidiDeviceManager();
  });

  it("can be created", () => {
    expect(manager).toBeDefined();
    expect(typeof manager.initialize).toBe("function");
    expect(typeof manager.getInputDevices).toBe("function");
    expect(typeof manager.onMessage).toBe("function");
    expect(typeof manager.connectDevice).toBe("function");
    expect(typeof manager.disconnect).toBe("function");
    expect(typeof manager.dispose).toBe("function");
  });

  it("initialize returns false when navigator.requestMIDIAccess not available", async () => {
    // jsdom does not provide Web MIDI API
    const result = await manager.initialize();
    expect(result).toBe(false);
  });

  it("getInputDevices returns empty array before init", () => {
    expect(manager.getInputDevices()).toEqual([]);
  });

  it("onMessage returns unsubscribe function", () => {
    const unsub = manager.onMessage(() => {});
    expect(typeof unsub).toBe("function");
    unsub(); // should not throw
  });

  it("connectDevice returns false when not initialized", () => {
    expect(manager.connectDevice("some-id")).toBe(false);
  });

  it("disconnect does not throw when not connected", () => {
    expect(() => {
      manager.disconnect();
    }).not.toThrow();
  });

  it("dispose does not throw", () => {
    expect(() => {
      manager.dispose();
    }).not.toThrow();
  });
});
