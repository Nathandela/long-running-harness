/**
 * Zod schemas for effects state serialization.
 */

import { z } from "zod/v4";

export const effectSlotSchema = z.object({
  id: z.string(),
  typeId: z.string(),
  bypassed: z.boolean(),
  params: z.record(z.string(), z.number()),
});

export const trackEffectsSchema = z.object({
  trackId: z.string(),
  slots: z.array(effectSlotSchema),
});

export const effectsSectionSchema = z.array(trackEffectsSchema);

export type EffectsSectionSchema = z.infer<typeof effectsSectionSchema>;
