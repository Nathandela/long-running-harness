/**
 * Zod schema for modulation matrix serialization.
 * Used for session persistence and preset import/export.
 */

import { z } from "zod/v4";
import { MOD_SOURCES, MOD_DESTINATIONS } from "@audio/synth/modulation-types";

export const modulationRouteSchema = z.object({
  id: z.string(),
  source: z.enum(MOD_SOURCES),
  destination: z.enum(MOD_DESTINATIONS),
  amount: z.number().min(-1).max(1),
  bipolar: z.boolean(),
});

export const modulationSectionSchema = z.record(
  z.string(),
  z.array(modulationRouteSchema),
);

export type ModulationSection = z.infer<typeof modulationSectionSchema>;
