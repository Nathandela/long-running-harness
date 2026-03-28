/**
 * Clip playback scheduler.
 * Schedules AudioBufferSourceNode instances for clips within the look-ahead window.
 * Integrates with the existing LookAheadScheduler pattern.
 */

import type { ClipModel } from "@state/track/types";

type ScheduledClip = {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  clipId: string;
};

export type ClipScheduler = {
  /**
   * Schedule clips that start within the look-ahead window.
   * @param clips - Clips to potentially schedule
   * @param windowStart - Start of look-ahead window (AudioContext time)
   * @param windowEnd - End of look-ahead window (AudioContext time)
   * @param getBuffer - Resolve sourceId to AudioBuffer
   * @param destination - Node to connect scheduled clips to
   */
  scheduleClips(
    clips: readonly ClipModel[],
    windowStart: number,
    windowEnd: number,
    getBuffer: (sourceId: string) => AudioBuffer | undefined,
    destination: AudioNode,
  ): void;

  /** Stop all currently scheduled clips */
  stopAll(): void;

  /** Clean up completed clips from internal tracking */
  cleanup(): void;
};

export function createClipScheduler(ctx: AudioContext): ClipScheduler {
  const scheduled = new Map<string, ScheduledClip>();

  return {
    scheduleClips(
      clips: readonly ClipModel[],
      windowStart: number,
      windowEnd: number,
      getBuffer: (sourceId: string) => AudioBuffer | undefined,
      destination: AudioNode,
    ): void {
      for (const clip of clips) {
        // Skip if already scheduled
        if (scheduled.has(clip.id)) continue;

        // Check if clip starts within the look-ahead window
        if (clip.startTime < windowStart || clip.startTime >= windowEnd) {
          continue;
        }

        const buffer = getBuffer(clip.sourceId);
        if (!buffer) continue;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Create gain node for clip-level gain and fades
        const gainNode = ctx.createGain();
        gainNode.gain.value = clip.gain;

        // Apply fade-in
        if (clip.fadeIn > 0) {
          gainNode.gain.setValueAtTime(0, clip.startTime);
          gainNode.gain.linearRampToValueAtTime(
            clip.gain,
            clip.startTime + clip.fadeIn,
          );
        }

        // Apply fade-out
        if (clip.fadeOut > 0) {
          const fadeOutStart = clip.startTime + clip.duration - clip.fadeOut;
          gainNode.gain.setValueAtTime(clip.gain, fadeOutStart);
          gainNode.gain.linearRampToValueAtTime(
            0,
            clip.startTime + clip.duration,
          );
        }

        // Connect: source -> gainNode -> destination
        source.connect(gainNode);
        gainNode.connect(destination);

        // Schedule playback
        source.start(clip.startTime, clip.sourceOffset, clip.duration);

        const entry: ScheduledClip = {
          source,
          gainNode,
          clipId: clip.id,
        };
        scheduled.set(clip.id, entry);

        // Auto-cleanup when playback ends
        source.addEventListener("ended", () => {
          gainNode.disconnect();
          scheduled.delete(clip.id);
        });
      }
    },

    stopAll(): void {
      for (const entry of scheduled.values()) {
        try {
          entry.source.stop();
        } catch {
          // Source may have already stopped
        }
        entry.gainNode.disconnect();
      }
      scheduled.clear();
    },

    cleanup(): void {
      // Entries auto-clean via ended event, but this forces a sweep
      for (const [id, entry] of scheduled) {
        try {
          // If source has ended, clean up
          entry.gainNode.disconnect();
          scheduled.delete(id);
        } catch {
          // Still playing
        }
      }
    },
  };
}
