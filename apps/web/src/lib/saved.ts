import { z } from 'zod'

/** Saved comparisons (D10): named URL snapshots in localStorage — no accounts in v1. */

const savedComparisonSchema = z.object({
  name: z.string().min(1).max(60),
  m: z.string().min(1),
  savedAt: z.number(),
})
export type SavedComparison = z.infer<typeof savedComparisonSchema>

const KEY = 'modelbeats.saved-comparisons'

export function listSaved(): SavedComparison[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = savedComparisonSchema
      .array()
      .safeParse(JSON.parse(localStorage.getItem(KEY) ?? '[]'))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export function saveComparison(name: string, m: string): SavedComparison[] {
  const next = [{ name, m, savedAt: Date.now() }, ...listSaved().filter((s) => s.name !== name)]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function removeComparison(name: string): SavedComparison[] {
  const next = listSaved().filter((s) => s.name !== name)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
