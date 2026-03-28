import { z } from "zod/v4";

export const clipSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  sourceId: z.string(),
  startTime: z.number().min(0),
  sourceOffset: z.number().min(0),
  duration: z.number().min(0),
  gain: z.number().min(0).max(2),
  fadeIn: z.number().min(0),
  fadeOut: z.number().min(0),
  name: z.string(),
});

export type ClipSchema = z.infer<typeof clipSchema>;

export const trackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["audio", "instrument"]),
  color: z.string(),
  muted: z.boolean(),
  solo: z.boolean(),
  armed: z.boolean(),
  volume: z.number().min(0).max(2),
  pan: z.number().min(-1).max(1),
  clipIds: z.array(z.string()),
});

export type TrackSchema = z.infer<typeof trackSchema>;
