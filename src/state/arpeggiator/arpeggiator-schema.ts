/**
 * Zod schemas for arpeggiator state serialization.
 */

import { z } from "zod/v4";
import type { ArpParams } from "@audio/arpeggiator/arpeggiator-types";

export const arpParamsSchema = z.object({
  enabled: z.boolean(),
  pattern: z.enum(["up", "down", "up-down", "down-up", "random", "as-played"]),
  rateDivision: z.enum([
    "1/4",
    "1/8",
    "1/16",
    "1/32",
    "1/4t",
    "1/8t",
    "1/16t",
    "1/32t",
  ]),
  octaveRange: z.number().int().min(1).max(4),
  octaveDirection: z.enum(["up", "down", "up-down"]),
  gate: z.number().min(0.01).max(1),
  swing: z.number().min(0).max(1),
  latch: z.boolean(),
});

export const trackArpSchema = z.object({
  trackId: z.string(),
  params: arpParamsSchema,
});

export const arpeggiatorSectionSchema = z.array(trackArpSchema);

export type ArpeggiatorSectionSchema = z.infer<typeof arpeggiatorSectionSchema>;

// Compile-time check: ArpParams and arpParamsSchema stay in sync
type _SchemaType = z.infer<typeof arpParamsSchema>;
const _syncCheck: _SchemaType = null as unknown as ArpParams;
const _reverseCheck: ArpParams = null as unknown as _SchemaType;
void _syncCheck;
void _reverseCheck;
