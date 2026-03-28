import { z } from "zod/v4";

export const SESSION_VERSION = 1;

export const metaSectionSchema = z.object({
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const transportSectionSchema = z.object({
  bpm: z.number(),
  loopEnabled: z.boolean(),
  loopStart: z.number(),
  loopEnd: z.number(),
});

export const mixerSectionSchema = z.object({
  masterVolume: z.number(),
});

export const sessionSchema = z.object({
  version: z.number(),
  meta: metaSectionSchema,
  transport: transportSectionSchema,
  tracks: z.array(z.unknown()),
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
    mixer: { masterVolume: 1 },
  };
}
