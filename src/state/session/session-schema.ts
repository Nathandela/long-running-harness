import { z } from "zod/v4";
import { trackSchema, clipSchema } from "@state/track/index";

export const SESSION_VERSION = 1;

export const metaSectionSchema = z.object({
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const transportSectionSchema = z
  .object({
    bpm: z.number().min(1).max(999),
    loopEnabled: z.boolean(),
    loopStart: z.number().min(0),
    loopEnd: z.number().min(0),
  })
  .refine((t) => t.loopEnd >= t.loopStart, {
    message: "loopEnd must be >= loopStart",
  });

export const mixerSectionSchema = z.object({
  masterVolume: z.number().min(0).max(2),
});

export const sessionSchema = z.object({
  version: z.literal(SESSION_VERSION),
  meta: metaSectionSchema,
  transport: transportSectionSchema,
  tracks: z.array(trackSchema),
  clips: z.array(clipSchema),
  mixer: mixerSectionSchema,
});

export type SessionSchema = z.infer<typeof sessionSchema>;

export function createDefaultSession(): SessionSchema {
  const now = Date.now();
  return {
    version: SESSION_VERSION,
    meta: { name: "Untitled", createdAt: now, updatedAt: now },
    transport: { bpm: 120, loopEnabled: false, loopStart: 0, loopEnd: 0 },
    tracks: [],
    clips: [],
    mixer: { masterVolume: 1 },
  };
}
