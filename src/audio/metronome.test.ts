/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetronome } from "./metronome";

function createMockOscillator(): OscillatorNode {
  return {
    type: "sine",
    frequency: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as OscillatorNode;
}

function createMockGain(): GainNode {
  return {
    gain: { value: 1, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  } as unknown as GainNode;
}

function createMockCtx(): AudioContext {
  const mockGain = createMockGain();
  return {
    currentTime: 0,
    destination: {} as AudioDestinationNode,
    createOscillator: vi.fn(() => createMockOscillator()),
    createGain: vi.fn(() => mockGain),
  } as unknown as AudioContext;
}

describe("createMetronome", () => {
  let ctx: AudioContext;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("creates without error", () => {
    const met = createMetronome(ctx);
    expect(met).toBeDefined();
    met.dispose();
  });

  it("schedules a downbeat tick at 1000Hz", () => {
    const met = createMetronome(ctx);
    met.setEnabled(true);
    met.scheduleTick(1.0, true);

    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock
      .results[0]?.value as ReturnType<typeof createMockOscillator>;
    expect(osc).toBeDefined();
    expect(osc.frequency.value).toBe(1000);
    expect(osc.start).toHaveBeenCalledWith(1.0);
    met.dispose();
  });

  it("schedules an upbeat tick at 800Hz", () => {
    const met = createMetronome(ctx);
    met.setEnabled(true);
    met.scheduleTick(2.0, false);

    const osc = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock
      .results[0]?.value as ReturnType<typeof createMockOscillator>;
    expect(osc).toBeDefined();
    expect(osc.frequency.value).toBe(800);
    met.dispose();
  });

  it("does not schedule when disabled", () => {
    const met = createMetronome(ctx);
    met.setEnabled(false);
    met.scheduleTick(1.0, true);
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    met.dispose();
  });

  it("is disabled by default", () => {
    const met = createMetronome(ctx);
    met.scheduleTick(1.0, true);
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    met.dispose();
  });

  it("silences immediately on dispose", () => {
    const met = createMetronome(ctx);
    const mockGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock
      .results[0]?.value as ReturnType<typeof createMockGain>;
    met.dispose();
    expect(mockGain.disconnect).toHaveBeenCalled();
  });
});
