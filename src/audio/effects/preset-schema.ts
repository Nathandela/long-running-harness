/**
 * Zod schema for effect preset validation.
 */

import { z } from "zod/v4";
import type { EffectPreset } from "./types";

export const effectPresetSchema = z.object({
  typeId: z.string(),
  name: z.string(),
  params: z.record(z.string(), z.number()),
});

export function validatePreset(data: unknown): EffectPreset {
  return effectPresetSchema.parse(data);
}
