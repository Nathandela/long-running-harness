/**
 * Zod schemas for automation state serialization.
 */

import { z } from "zod/v4";

export const automationPointSchema = z.object({
  id: z.string(),
  time: z.number().min(0),
  value: z.number().min(0).max(1),
  interpolation: z.enum(["linear", "curved"]),
  curve: z.number().min(-1).max(1),
});

const mixerTargetSchema = z.object({
  type: z.literal("mixer"),
  param: z.enum(["volume", "pan"]),
});

const effectTargetSchema = z.object({
  type: z.literal("effect"),
  effectId: z.string(),
  paramKey: z.string(),
});

const synthTargetSchema = z.object({
  type: z.literal("synth"),
  paramKey: z.string(),
});

export const parameterTargetSchema = z.discriminatedUnion("type", [
  mixerTargetSchema,
  effectTargetSchema,
  synthTargetSchema,
]);

export const automationLaneSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  target: parameterTargetSchema,
  points: z.array(automationPointSchema),
  mode: z.enum(["read", "write", "touch"]),
  armed: z.boolean(),
});

export const trackAutomationSchema = z.object({
  trackId: z.string(),
  lanes: z.array(automationLaneSchema),
});

export const automationSectionSchema = z.array(trackAutomationSchema);

export type AutomationSectionSchema = z.infer<typeof automationSectionSchema>;
