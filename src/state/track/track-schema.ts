import { z } from "zod/v4";

export const noteEventSchema = z.object({
  id: z.string(),
  pitch: z.number().int().min(0).max(127),
  velocity: z.number().int().min(0).max(127),
  startTime: z.number().min(0),
  duration: z.number().gt(0),
});

export const audioClipSchema = z.object({
  type: z.literal("audio"),
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

export const midiClipSchema = z.object({
  type: z.literal("midi"),
  id: z.string(),
  trackId: z.string(),
  startTime: z.number().min(0),
  duration: z.number().min(0),
  noteEvents: z.array(noteEventSchema),
  name: z.string(),
});

export const clipSchema = z.discriminatedUnion("type", [
  audioClipSchema,
  midiClipSchema,
]);

export type ClipSchema = z.infer<typeof clipSchema>;

export const trackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["audio", "instrument"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  muted: z.boolean(),
  solo: z.boolean(),
  armed: z.boolean(),
  soloIsolate: z.boolean(),
  volume: z.number().min(0).max(2),
  pan: z.number().min(-1).max(1),
  clipIds: z.array(z.string()),
});

export type TrackSchema = z.infer<typeof trackSchema>;
