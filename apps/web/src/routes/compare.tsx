import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { CompareScreen } from '#/components/compare/compare-screen'
import { catalogQueryOptions } from '#/lib/catalog'

/**
 * Static schema default: a corpus-guaranteed real pair (current closed frontier vs current
 * open frontier) — the search schema needs a literal at module scope, since the catalog
 * loads async. `CompareRoute` below adds a runtime catalog-derived fallback for resilience
 * if a future dataset regeneration ever drops one of these exact slugs.
 */
const DEFAULT_M = 'gpt-5-6,deepseek-v3-1-thinking'

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
      { title: 'Compare models · RankedModel' },
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
  const parts = m.split(',').slice(0, 3)
  const known = new Set(data.models.map((x) => x.slug))
  const byIndex = [...data.models].sort((a, b) => b.index - a.index)
  const topOpen = byIndex.find((x) => x.open)
  // Slot A/B must always resolve to a real model (never an empty compare slot); slot C
  // (index 2) is genuinely optional and stays blank when absent.
  const fallback = (i: 0 | 1) => (i === 1 ? (topOpen ?? byIndex[0])?.slug : byIndex[0]?.slug) ?? ''
  const resolve = (i: 0 | 1 | 2): string => {
    const raw = parts[i]
    if (i === 2) return raw ?? ''
    return raw && known.has(raw) ? raw : fallback(i)
  }
  const slugs: [string, string, string] = [resolve(0), resolve(1), resolve(2)]
  return (
    <CompareScreen
      catalog={data}
      slugs={slugs}
      onChangeSlugs={(next) =>
        navigate({ search: { m: next.filter((s, i) => s || i < 2).join(',') } })
      }
    />
  )
}
