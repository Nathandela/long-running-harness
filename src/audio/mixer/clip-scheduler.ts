/**
 * Clip playback scheduler.
 * Schedules AudioBufferSourceNode instances for clips within the look-ahead window.
 * Integrates with the existing LookAheadScheduler pattern.
 *
 * Time model: clips use arrangement time (seconds on timeline).
 * The caller provides a `timeOffset` to convert to AudioContext time:
 *   audioContextTime = arrangementTime + timeOffset
 */

import type { AudioClipModel } from "@state/track/types";

type ScheduledClip = {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  clipId: string;
  /** AudioContext time when this clip's playback ends */
  endTime: number;
};

export type ClipScheduler = {
  /**
   * Schedule clips that overlap the look-ahead window.
   * @param clips - Clips to potentially schedule
   * @param windowStart - Start of look-ahead window (AudioContext time)
   * @param windowEnd - End of look-ahead window (AudioContext time)
   * @param timeOffset - Offset to convert arrangement time to AudioContext time
   *                     (audioCtxTime = arrangementTime + timeOffset)
   * @param getBuffer - Resolve sourceId to AudioBuffer
   * @param destination - Node to connect scheduled clips to
   */
  scheduleClips(
    clips: readonly AudioClipModel[],
    windowStart: number,
    windowEnd: number,
    timeOffset: number,
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
      clips: readonly AudioClipModel[],
      windowStart: number,
      windowEnd: number,
      timeOffset: number,
      getBuffer: (sourceId: string) => AudioBuffer | undefined,
      destination: AudioNode,
    ): void {
      for (const clip of clips) {
        // Convert arrangement time to AudioContext time
        const clipStartCtx = clip.startTime + timeOffset;
        const clipEndCtx = clipStartCtx + clip.duration;

        // Skip if already scheduled and still playing
        if (scheduled.has(clip.id)) continue;

        // Check if clip overlaps the look-ahead window
        if (clipEndCtx <= windowStart || clipStartCtx >= windowEnd) {
          continue;
        }

        const buffer = getBuffer(clip.sourceId);
        if (!buffer) continue;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Compute source offset for mid-clip seeking
        const seekOffset =
          clipStartCtx < windowStart ? windowStart - clipStartCtx : 0;
        const sourceOffset = clip.sourceOffset + seekOffset;
        const playDuration = clip.duration - seekOffset;
        const playStartCtx = clipStartCtx + seekOffset;

        // Create gain node for clip-level gain and fades
        const gainNode = ctx.createGain();
        gainNode.gain.value = clip.gain;

        // Clamp fades to avoid overlap
        const maxFadeIn = Math.min(clip.fadeIn, clip.duration);
        const maxFadeOut = Math.min(clip.fadeOut, clip.duration - maxFadeIn);

        // Apply fade-in (only if we haven't seeked past it)
        if (maxFadeIn > 0 && seekOffset < maxFadeIn) {
          const fadeInStart = clipStartCtx + seekOffset;
          const fadeInRemaining = maxFadeIn - seekOffset;
          const startGain =
            seekOffset > 0 ? (seekOffset / maxFadeIn) * clip.gain : 0;
          gainNode.gain.setValueAtTime(startGain, fadeInStart);
          gainNode.gain.linearRampToValueAtTime(
            clip.gain,
            fadeInStart + fadeInRemaining,
          );
        }

        // Apply fade-out (mirror of fade-in: handle mid-fade seeking)
        if (maxFadeOut > 0) {
          const fadeOutStartCtx = clipEndCtx - maxFadeOut;
          const fadeOutStartInClip = clip.duration - maxFadeOut;

          if (seekOffset >= fadeOutStartInClip) {
            // Seeking into the fade-out region: compute partial gain
            const fadeOutProgress =
              (seekOffset - fadeOutStartInClip) / maxFadeOut;
            const startGain = clip.gain * (1 - fadeOutProgress);
            gainNode.gain.setValueAtTime(startGain, playStartCtx);
            gainNode.gain.linearRampToValueAtTime(0, clipEndCtx);
          } else {
            gainNode.gain.setValueAtTime(clip.gain, fadeOutStartCtx);
            gainNode.gain.linearRampToValueAtTime(0, clipEndCtx);
          }
        }

        // Connect: source -> gainNode -> destination
        source.connect(gainNode);
        gainNode.connect(destination);

        // Schedule playback using AudioContext time
        source.start(playStartCtx, sourceOffset, playDuration);

        const entry: ScheduledClip = {
          source,
          gainNode,
          clipId: clip.id,
          endTime: clipEndCtx,
        };
        scheduled.set(clip.id, entry);

        // Auto-cleanup when playback ends
        source.addEventListener("ended", () => {
          // Only remove if this is still the active entry for this clip
          const current = scheduled.get(clip.id);
          if (current === entry) {
            gainNode.disconnect();
            scheduled.delete(clip.id);
          }
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
      const now = ctx.currentTime;
      for (const [id, entry] of scheduled) {
        if (entry.endTime <= now) {
          entry.gainNode.disconnect();
          scheduled.delete(id);
        }
      }
    },
  };
}
