import { z } from 'zod'
import { GPU_KINDS, INFERENCE_FRAMEWORKS } from '../enums'
import { slugSchema } from './common'

/**
 * `vramGb` is the *usable* memory budget. For Macs the curated values already apply the
 * unified-memory discount (M3 Max 128 GB → 96), so the fit engine (C2) must NOT discount again.
 */
export const hardwareProfileSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  kind: z.enum(GPU_KINDS),
  vramGb: z.number().positive(),
  notes: z.string().optional(),
})

/** One row of data/throughput/estimates.csv. */
export const throughputRowSchema = z.object({
  modelSlug: slugSchema,
  quantMethod: z.string().min(1),
  hardwareSlug: slugSchema,
  framework: z.enum(INFERENCE_FRAMEWORKS),
  tokensPerSec: z.number().positive(),
  contextTested: z.number().int().positive().optional(),
  source: z.string().optional(),
  sourceUrl: z.url().optional(),
})

export type HardwareProfile = z.infer<typeof hardwareProfileSchema>
export type ThroughputRow = z.infer<typeof throughputRowSchema>
