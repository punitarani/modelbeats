import { z } from 'zod'
import { slugSchema } from './common'

export const organizationSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  type: z.enum(['lab', 'company', 'community']).default('company'),
  country: z.string().min(2).optional(),
  url: z.url().optional(),
  description: z.string().optional(),
})

export type Organization = z.infer<typeof organizationSchema>
