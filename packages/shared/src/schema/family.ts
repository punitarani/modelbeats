import { z } from 'zod'
import { slugSchema } from './common'

export const familySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  orgSlug: slugSchema,
  description: z.string().optional(),
})

export type Family = z.infer<typeof familySchema>
