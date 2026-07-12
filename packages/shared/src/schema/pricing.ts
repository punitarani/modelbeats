import { z } from 'zod'
import { isoDateSchema, slugSchema } from './common'

/** One row of data/pricing/api-pricing.csv. */
export const pricingRowSchema = z.object({
  modelSlug: slugSchema,
  provider: z.string().min(1),
  inputPerMtok: z.number().positive(),
  outputPerMtok: z.number().positive(),
  effectiveDate: isoDateSchema.optional(),
})

export type PricingRow = z.infer<typeof pricingRowSchema>
