import { z } from 'zod'
import { BENCHMARK_CATEGORIES } from '../enums'
import { slugSchema } from './common'

/**
 * `normMin`/`normMax` are the curated normalization bounds (D2) used by the index —
 * distinct from any display scale. E.g. arena 1150–1520, mmlu 40–100.
 */
export const benchmarkSchema = z
  .object({
    slug: slugSchema,
    name: z.string().min(1),
    category: z.enum(BENCHMARK_CATEGORIES),
    unit: z.string().min(1),
    description: z.string().min(1),
    normMin: z.number(),
    normMax: z.number(),
    higherIsBetter: z.boolean().default(true),
    methodologyUrl: z.url().optional(),
  })
  .refine((b) => b.normMax > b.normMin, {
    message: 'normMax must be greater than normMin',
    path: ['normMax'],
  })

export type Benchmark = z.infer<typeof benchmarkSchema>
