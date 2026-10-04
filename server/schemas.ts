import { z } from "zod";

export const accessibilityProfileSchema = z.object({
  stepFree: z.boolean().default(true),
  avoidLongWalks: z.boolean().default(true),
  avoidCrowds: z.boolean().default(false),
  needsAccessibleToilet: z.boolean().default(false),
  maximumWalkMinutes: z.number().int().min(2).max(60).default(12),
  notes: z.string().max(500).default("")
});

export const planRequestSchema = z.object({
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  mode: z.enum(["live", "replay", "scenario"]).default("replay"),
  profile: accessibilityProfileSchema
});

export const voiceRequestSchema = z.object({
  text: z.string().min(1).max(2500)
});
