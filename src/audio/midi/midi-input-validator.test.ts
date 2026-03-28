import { describe, it, expect } from "vitest";
import {
  clampMidi7Bit,
  clampMidi14Bit,
  validateMidiMessage,
  validateSysEx,
} from "./midi-input-validator";

describe("clampMidi7Bit", () => {
  it("passes through values in range", () => {
    expect(clampMidi7Bit(0)).toBe(0);
    expect(clampMidi7Bit(64)).toBe(64);
    expect(clampMidi7Bit(127)).toBe(127);
  });

  it("clamps negative values to 0", () => {
    expect(clampMidi7Bit(-1)).toBe(0);
    expect(clampMidi7Bit(-100)).toBe(0);
  });

  it("clamps values above 127 to 127", () => {
    expect(clampMidi7Bit(128)).toBe(127);
    expect(clampMidi7Bit(999)).toBe(127);
  });

  it("floors fractional values before clamping", () => {
    expect(clampMidi7Bit(64.9)).toBe(64);
    expect(clampMidi7Bit(127.5)).toBe(127);
  });
});

describe("clampMidi14Bit", () => {
  it("passes through values in range", () => {
    expect(clampMidi14Bit(0)).toBe(0);
    expect(clampMidi14Bit(8192)).toBe(8192);
    expect(clampMidi14Bit(16383)).toBe(16383);
  });

  it("clamps negative values to 0", () => {
    expect(clampMidi14Bit(-1)).toBe(0);
  });

  it("clamps values above 16383 to 16383", () => {
    expect(clampMidi14Bit(16384)).toBe(16383);
    expect(clampMidi14Bit(99999)).toBe(16383);
  });
});

describe("validateMidiMessage", () => {
  it("parses note-on correctly", () => {
    // Note On, channel 0, note 60, velocity 100
    const result = validateMidiMessage(new Uint8Array([0x90, 60, 100]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message).toEqual({
      type: "note-on",
      note: 60,
      velocity: 100,
      channel: 0,
    });
  });

  it("parses note-on on channel 5", () => {
    const result = validateMidiMessage(new Uint8Array([0x95, 72, 80]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message).toEqual({
      type: "note-on",
      note: 72,
      velocity: 80,
      channel: 5,
    });
  });

  it("converts note-on with velocity 0 to note-off", () => {
    const result = validateMidiMessage(new Uint8Array([0x90, 60, 0]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message).toEqual({
      type: "note-off",
      note: 60,
      channel: 0,
    });
  });

  it("parses note-off correctly", () => {
    // Note Off, channel 2, note 48
    const result = validateMidiMessage(new Uint8Array([0x82, 48, 64]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message).toEqual({
      type: "note-off",
      note: 48,
      channel: 2,
    });
  });

  it("parses CC correctly", () => {
    // CC, channel 0, controller 1 (mod wheel), value 100
    const result = validateMidiMessage(new Uint8Array([0xb0, 1, 100]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message).toEqual({
      type: "cc",
      controller: 1,
      value: 100,
      channel: 0,
    });
  });

  it("parses pitch bend correctly (14-bit reconstruction)", () => {
    // Pitch Bend, channel 0, LSB=0, MSB=64 => value = 64*128 + 0 = 8192 (center)
    const result = validateMidiMessage(new Uint8Array([0xe0, 0, 64]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message).toEqual({
      type: "pitch-bend",
      value: 8192,
      channel: 0,
    });
  });

  it("parses pitch bend with both LSB and MSB", () => {
    // LSB=127, MSB=127 => 127*128 + 127 = 16383 (max)
    const result = validateMidiMessage(new Uint8Array([0xe0, 127, 127]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message).toEqual({
      type: "pitch-bend",
      value: 16383,
      channel: 0,
    });
  });

  it("clamps out-of-range note values", () => {
    // Note value 200 should be clamped to 127
    const result = validateMidiMessage(new Uint8Array([0x90, 200, 100]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message.type).toBe("note-on");
    if (result.message.type !== "note-on") return;
    expect(result.message.note).toBe(127);
  });

  it("clamps out-of-range CC values", () => {
    // CC value 200 should be clamped to 127
    const result = validateMidiMessage(new Uint8Array([0xb0, 200, 200]));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.message.type).toBe("cc");
    if (result.message.type !== "cc") return;
    expect(result.message.controller).toBe(127);
    expect(result.message.value).toBe(127);
  });

  it("rejects empty data", () => {
    const result = validateMidiMessage(new Uint8Array([]));
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.reason).toBeDefined();
  });

  it("rejects unknown status bytes", () => {
    // 0xF2 = Song Position Pointer -- not handled
    const result = validateMidiMessage(new Uint8Array([0xf2, 0, 0]));
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.reason).toContain("Unsupported");
  });

  it("rejects messages with insufficient data bytes", () => {
    // Note On needs 3 bytes, only 2 provided
    const result = validateMidiMessage(new Uint8Array([0x90, 60]));
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.reason).toBeDefined();
  });
});

describe("validateSysEx", () => {
  it("accepts messages under 1KB with proper framing", () => {
    const data = new Uint8Array(100);
    data[0] = 0xf0;
    data[99] = 0xf7;
    expect(validateSysEx(data)).toEqual({ valid: true });
  });

  it("rejects messages over 1KB", () => {
    const data = new Uint8Array(1025);
    data[0] = 0xf0;
    data[1024] = 0xf7;
    const result = validateSysEx(data);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects messages without F0 start byte", () => {
    const data = new Uint8Array([0x00, 0x01, 0xf7]);
    const result = validateSysEx(data);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("rejects messages without F7 end byte", () => {
    const data = new Uint8Array([0xf0, 0x01, 0x02]);
    const result = validateSysEx(data);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
