import { type SnapshotModel, searchModels } from '@modelbeats/shared'

type Option = { value: string; label: string }

/**
 * SearchSelect `rankOptions` factory for model pickers: reuses `searchModels`' relevance
 * order (match quality → recency → Frontier Elo) restricted to the options actually in
 * the list — so a picker showing a subset (e.g. open models with Q4 VRAM) keeps the same
 * ordering semantics as global search.
 */
export function modelOptionRanker(models: SnapshotModel[]) {
  return (options: ReadonlyArray<Option>, q: string): Option[] => {
    const byValue = new Map(options.map((o) => [o.value, o]))
    const out: Option[] = []
    for (const m of searchModels(models, q, models.length)) {
      const o = byValue.get(m.slug)
      if (o) out.push(o)
    }
    return out
  }
}
