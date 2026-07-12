import { z } from 'zod'
import { RESULT_SOURCES } from '../enums'
import { isoDateSchema, slugSchema } from './common'

/** One row of data/results/{benchmarkSlug}.csv (benchmark comes from the filename). */
export const resultRowSchema = z.object({
  modelSlug: slugSchema,
  score: z.number(),
  source: z.enum(RESULT_SOURCES),
  sourceUrl: z.url().optional(),
  evaluatedAt: isoDateSchema.optional(),
  notes: z.string().optional(),
})

export type ResultRow = z.infer<typeof resultRowSchema>
