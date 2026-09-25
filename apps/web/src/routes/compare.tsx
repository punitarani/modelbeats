import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { CompareScreen } from '#/components/compare/compare-screen'
import { catalogQueryOptions } from '#/lib/catalog'

/**
 * Static schema default: a corpus-guaranteed real pair that actually shares well-covered
 * benchmarks (both report AIME/GPQA/HLE/SWE-bench), so the head-to-head lands on populated
 * rows rather than a wall of em-dashes. The search schema needs a literal at module scope,
 * since the catalog loads async; `CompareRoute` below adds a runtime catalog-derived fallback
 * (rank-eligible models only) if a future dataset regeneration ever drops one of these slugs.
 */
const DEFAULT_M = 'gpt-5-2,deepseek-v3-1-thinking'

export const Route = createFileRoute('/compare')({
  validateSearch: z.object({
    m: z
      .string()
      .regex(/^[a-z0-9,-]*$/)
      .default(DEFAULT_M)
      .catch(DEFAULT_M),
  }),
  search: { middlewares: [stripSearchParams({ m: DEFAULT_M })] },
  head: () => ({
    meta: [
      { title: 'Compare models · Model Beats' },
      {
        name: 'description',
        content: 'Side-by-side LLM comparison: specs, benchmarks and capability radar.',
      },
    ],
  }),
  component: CompareRoute,
})

function CompareRoute() {
  const { m } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useSuspenseQuery(catalogQueryOptions)
  const parts = m.split(',').slice(0, 4)
  const known = new Set(data.models.map((x) => x.slug))
  // Fall back to rank-eligible models only (never a sparse, unrated model — D20).
  const byRank = data.models
    .filter((x) => x.ranked && x.rank != null)
    .sort((a, b) => (a.rank as number) - (b.rank as number))
  const topOpen = byRank.find((x) => x.open)
  // Slots A/B must always resolve to a real model (never an empty compare slot); slots C/D
  // are genuinely optional and stay blank when absent or unknown.
  const fallback = (i: 0 | 1) => (i === 1 ? (topOpen ?? byRank[0])?.slug : byRank[0]?.slug) ?? ''
  const resolve = (i: number): string => {
    const raw = parts[i]
    if (i >= 2) return raw && known.has(raw) ? raw : ''
    return raw && known.has(raw) ? raw : fallback(i as 0 | 1)
  }
  const slugs = [resolve(0), resolve(1), resolve(2), resolve(3)]
  return (
    <CompareScreen
      catalog={data}
      slugs={slugs}
      onChangeSlugs={(next) =>
        // Positional join: a set D with empty C must keep its comma (`a,b,,d`), while
        // trailing empties are dropped (`a,b,,` → `a,b`).
        navigate({ search: { m: next.join(',').replace(/,+$/, '') } })
      }
    />
  )
}
