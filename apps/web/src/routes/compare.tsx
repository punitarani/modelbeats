import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { CompareScreen } from '#/components/compare/compare-screen'
import { catalogQueryOptions } from '#/lib/catalog'

/** Design defaults: A = claude-opus-4-8, B = deepseek-v4-5, C empty. */
const DEFAULT_M = 'claude-opus-4-8,deepseek-v4-5'

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
  const slugs: [string, string, string] = [parts[0] ?? '', parts[1] ?? '', parts[2] ?? '']
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
