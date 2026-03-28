/**
 * MIDI input validation and clamping.
 * NFR-16: All MIDI input values clamped to valid ranges.
 * All external input treated as untrusted.
 */

// -- Validated message types --

export type ValidatedNoteOn = {
  readonly type: "note-on";
  readonly note: number; // 0-127
  readonly velocity: number; // 1-127 (0 is note-off)
  readonly channel: number; // 0-15
};

export type ValidatedNoteOff = {
  readonly type: "note-off";
  readonly note: number; // 0-127
  readonly channel: number; // 0-15
};

export type ValidatedCC = {
  readonly type: "cc";
  readonly controller: number; // 0-127
  readonly value: number; // 0-127
  readonly channel: number; // 0-15
};

export type ValidatedPitchBend = {
  readonly type: "pitch-bend";
  readonly value: number; // 0-16383
  readonly channel: number; // 0-15
};

export type ValidatedMidiMessage =
  | ValidatedNoteOn
  | ValidatedNoteOff
  | ValidatedCC
  | ValidatedPitchBend;

export type MidiValidationResult =
  | { readonly valid: true; readonly message: ValidatedMidiMessage }
  | { readonly valid: false; readonly reason: string };

// -- Constants --

const SYSEX_MAX_BYTES = 1024; // 1 KB
const SYSEX_START = 0xf0;
const SYSEX_END = 0xf7;

// Status byte high nibble ranges
const NOTE_OFF_MIN = 0x80;
const NOTE_OFF_MAX = 0x8f;
const NOTE_ON_MIN = 0x90;
const NOTE_ON_MAX = 0x9f;
const CC_MIN = 0xb0;
const CC_MAX = 0xbf;
const PITCH_BEND_MIN = 0xe0;
const PITCH_BEND_MAX = 0xef;

// -- Clamp functions --

/** Clamp a value to 7-bit MIDI range (0-127). */
export function clampMidi7Bit(value: number): number {
  return Math.min(127, Math.max(0, Math.floor(value)));
}

/** Clamp a value to 14-bit MIDI range (0-16383). */
export function clampMidi14Bit(value: number): number {
  return Math.min(16383, Math.max(0, Math.floor(value)));
}

// -- Validation --

/** Safe byte read -- returns 0 for out-of-bounds indices. */
function byte(data: Uint8Array, index: number): number {
  return data[index] ?? 0;
}

/** Validate raw MIDI bytes (Uint8Array) from Web MIDI API. */
export function validateMidiMessage(data: Uint8Array): MidiValidationResult {
  if (data.length === 0) {
    return { valid: false, reason: "Empty MIDI message" };
  }

  const status = byte(data, 0);
  const channel = status & 0x0f;

  if (status >= NOTE_OFF_MIN && status <= NOTE_OFF_MAX) {
    if (data.length < 3)
      return { valid: false, reason: "Note Off requires 3 bytes" };
    return {
      valid: true,
      message: {
        type: "note-off",
        note: clampMidi7Bit(byte(data, 1)),
        channel,
      },
    };
  }

  if (status >= NOTE_ON_MIN && status <= NOTE_ON_MAX) {
    if (data.length < 3)
      return { valid: false, reason: "Note On requires 3 bytes" };
    const note = clampMidi7Bit(byte(data, 1));
    const velocity = clampMidi7Bit(byte(data, 2));
    // Note-on with velocity 0 is conventionally note-off
    if (velocity === 0) {
      return { valid: true, message: { type: "note-off", note, channel } };
    }
    return {
      valid: true,
      message: { type: "note-on", note, velocity, channel },
    };
  }

  if (status >= CC_MIN && status <= CC_MAX) {
    if (data.length < 3) return { valid: false, reason: "CC requires 3 bytes" };
    return {
      valid: true,
      message: {
        type: "cc",
        controller: clampMidi7Bit(byte(data, 1)),
        value: clampMidi7Bit(byte(data, 2)),
        channel,
      },
    };
  }

  if (status >= PITCH_BEND_MIN && status <= PITCH_BEND_MAX) {
    if (data.length < 3)
      return { valid: false, reason: "Pitch Bend requires 3 bytes" };
    const lsb = clampMidi7Bit(byte(data, 1));
    const msb = clampMidi7Bit(byte(data, 2));
    return {
      valid: true,
      message: {
        type: "pitch-bend",
        value: clampMidi14Bit(msb * 128 + lsb),
        channel,
      },
    };
  }

  return {
    valid: false,
    reason: `Unsupported MIDI status byte: 0x${status.toString(16)}`,
  };
}

/** Validate SysEx message size (max 1KB) and framing. */
export function validateSysEx(data: Uint8Array): {
  valid: boolean;
  reason?: string;
} {
  if (data.length === 0) {
    return { valid: false, reason: "Empty SysEx message" };
  }
  if (byte(data, 0) !== SYSEX_START) {
    return { valid: false, reason: "SysEx must start with 0xF0" };
  }
  if (byte(data, data.length - 1) !== SYSEX_END) {
    return { valid: false, reason: "SysEx must end with 0xF7" };
  }
  if (data.length > SYSEX_MAX_BYTES) {
    return {
      valid: false,
      reason: `SysEx exceeds max size: ${String(data.length)} > ${String(SYSEX_MAX_BYTES)} bytes`,
    };
  }
  return { valid: true };
}
