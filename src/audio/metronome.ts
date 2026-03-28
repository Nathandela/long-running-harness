/**
 * Metronome using OscillatorNode bursts scheduled via AudioContext.currentTime.
 * Downbeat: 1000Hz, Upbeat: 800Hz, Duration: 30ms.
 *
 * INV-6: dispose() disconnects the gain node immediately, guaranteeing
 * silence within one audio quantum (~3ms at 44.1kHz).
 */

const DOWNBEAT_FREQ = 1000;
const UPBEAT_FREQ = 800;
const TICK_DURATION = 0.03; // 30ms

export type Metronome = {
  setEnabled(on: boolean): void;
  setVolume(gain: number): void;
  scheduleTick(time: number, isDownbeat: boolean): void;
  silence(): void;
  dispose(): void;
};

export function createMetronome(ctx: AudioContext): Metronome {
  let enabled = false;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.5;
  gainNode.connect(ctx.destination);

  return {
    setEnabled(on: boolean): void {
      enabled = on;
    },

    setVolume(gain: number): void {
      gainNode.gain.value = Math.max(0, Math.min(1, gain));
    },

    scheduleTick(time: number, isDownbeat: boolean): void {
      if (!enabled) return;

      const osc = ctx.createOscillator();
      osc.frequency.value = isDownbeat ? DOWNBEAT_FREQ : UPBEAT_FREQ;
      osc.connect(gainNode);
      osc.start(time);
      osc.stop(time + TICK_DURATION);
    },

    silence(): void {
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
    },

    dispose(): void {
      gainNode.disconnect();
    },
  };
}
