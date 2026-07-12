import { z } from 'zod'
import { isoDateSchema } from './common'

/** data/meta.json — dataset-level metadata. */
export const datasetMetaSchema = z.object({
  /** Human-readable snapshot date shown in the sidebar footer (e.g. "July 11, 2026"). */
  asOf: z.string().min(1),
  /** Machine form of the same date; the 90-day release window is computed against this. */
  asOfIso: isoDateSchema,
})

export type DatasetMeta = z.infer<typeof datasetMetaSchema>
