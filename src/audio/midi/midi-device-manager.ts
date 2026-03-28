/**
 * Web MIDI API device manager.
 * R-OPT-01: Accept MIDI note and CC messages from connected input devices.
 */

import {
  validateMidiMessage,
  type ValidatedMidiMessage,
} from "./midi-input-validator";

export type MidiDeviceInfo = {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;
  readonly state: "connected" | "disconnected";
};

export type MidiDeviceCallback = (message: ValidatedMidiMessage) => void;

export type MidiDeviceManager = {
  initialize(): Promise<boolean>;
  getInputDevices(): readonly MidiDeviceInfo[];
  onMessage(callback: MidiDeviceCallback): () => void;
  connectDevice(deviceId: string): boolean;
  disconnect(): void;
  dispose(): void;
};

export function createMidiDeviceManager(): MidiDeviceManager {
  let midiAccess: MIDIAccess | null = null;
  let connectedInput: MIDIInput | null = null;
  const listeners = new Set<MidiDeviceCallback>();

  function handleMidiMessage(event: MIDIMessageEvent): void {
    if (!event.data) return;
    const result = validateMidiMessage(event.data);
    if (!result.valid) return;
    for (const cb of listeners) {
      cb(result.message);
    }
  }

  function handleStateChange(): void {
    // Re-check connection state; if connected device is disconnected, clean up
    if (connectedInput && connectedInput.state === "disconnected") {
      connectedInput.onmidimessage = null;
      connectedInput = null;
    }
  }

  return {
    async initialize(): Promise<boolean> {
      if (
        typeof navigator === "undefined" ||
        !("requestMIDIAccess" in navigator)
      ) {
        return false;
      }
      try {
        midiAccess = await navigator.requestMIDIAccess();
        midiAccess.onstatechange = handleStateChange;
        return true;
      } catch {
        return false;
      }
    },

    getInputDevices(): readonly MidiDeviceInfo[] {
      if (!midiAccess) return [];
      const devices: MidiDeviceInfo[] = [];
      for (const input of midiAccess.inputs.values()) {
        devices.push({
          id: input.id,
          name: input.name ?? "Unknown",
          manufacturer: input.manufacturer ?? "Unknown",
          state: input.state,
        });
      }
      return devices;
    },

    onMessage(callback: MidiDeviceCallback): () => void {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },

    connectDevice(deviceId: string): boolean {
      if (!midiAccess) return false;
      const input = midiAccess.inputs.get(deviceId);
      if (!input) return false;

      // Disconnect previous
      if (connectedInput) {
        connectedInput.onmidimessage = null;
      }

      connectedInput = input;
      connectedInput.onmidimessage = handleMidiMessage;
      return true;
    },

    disconnect(): void {
      if (connectedInput) {
        connectedInput.onmidimessage = null;
        connectedInput = null;
      }
    },

    dispose(): void {
      if (connectedInput) {
        connectedInput.onmidimessage = null;
        connectedInput = null;
      }
      listeners.clear();
      if (midiAccess) {
        midiAccess.onstatechange = null;
        midiAccess = null;
      }
    },
  };
}
