import { z } from 'zod'
import { INFERENCE_FRAMEWORKS, RESULT_SOURCES } from './enums'
import { slugSchema } from './schema/common'

/**
 * Deep per-model payload (contract C3b) — the provenance-heavy detail deliberately kept
 * out of the headline catalog snapshot: full multi-source benchmark results, quantizations,
 * throughput, pricing and lineage. Built at publish time from `data/**` (one entry per
 * model, keyed by slug) and read in-memory by `getModel`. Previously the second D1 read
 * path (old D17); now a static build artifact like the catalog snapshot itself.
 */

export const modelDetailResultSchema = z.object({
  benchmarkSlug: slugSchema,
  score: z.number(),
  scoreNormalized: z.number().nullable(),
  source: z.enum(RESULT_SOURCES),
  sourceUrl: z.string().nullable(),
  evaluatedAt: z.string().nullable(),
  isVerified: z.boolean(),
  notes: z.string().nullable(),
})

export const modelDetailQuantSchema = z.object({
  method: z.string(),
  bits: z.number().nullable(),
  minVramGb: z.number().nullable(),
  diskSizeGb: z.number().nullable(),
})

export const modelDetailThroughputSchema = z.object({
  hardwareSlug: slugSchema,
  hardwareName: z.string(),
  quantMethod: z.string(),
  framework: z.enum(INFERENCE_FRAMEWORKS),
  tokensPerSec: z.number(),
  contextTested: z.number().nullable(),
})

export const modelDetailPricingSchema = z.object({
  provider: z.string(),
  inputPerMtok: z.number(),
  outputPerMtok: z.number(),
  effectiveDate: z.string(),
})

export const modelDetailSchema = z.object({
  slug: slugSchema,
  results: z.array(modelDetailResultSchema),
  quantizations: z.array(modelDetailQuantSchema),
  throughput: z.array(modelDetailThroughputSchema),
  pricing: z.array(modelDetailPricingSchema),
  lineage: z.object({
    predecessor: slugSchema.nullable(),
    successors: z.array(slugSchema),
  }),
})

/** The whole build artifact: slug → detail. */
export const modelDetailsMapSchema = z.record(slugSchema, modelDetailSchema)

export type ModelDetail = z.infer<typeof modelDetailSchema>
export type ModelDetailsMap = z.infer<typeof modelDetailsMapSchema>
