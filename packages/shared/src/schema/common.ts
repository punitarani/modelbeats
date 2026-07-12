import { z } from 'zod'

/** URL-stable identifier: kebab-case, digits allowed (e.g. `claude-opus-4-8`). */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case (lowercase letters, digits, hyphens)')

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'must be a real calendar date')

export type Slug = z.infer<typeof slugSchema>
