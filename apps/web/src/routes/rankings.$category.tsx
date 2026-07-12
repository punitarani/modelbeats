import { BENCHMARK_CATEGORIES, type BenchmarkCategory } from '@rankedmodel/shared'
import { createFileRoute, notFound, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { RankingsScreen } from '#/components/rankings/rankings-screen'
import {
  openFilterParam,
  orgParam,
  RANKINGS_SORT_KEYS,
  sortParam,
  textQueryParam,
} from '#/lib/search'

/** D6: /leaderboards/$category folded into /rankings/$category — same table, category columns. */
export const Route = createFileRoute('/rankings/$category')({
  params: {
    parse: (params) => {
      if (!(BENCHMARK_CATEGORIES as readonly string[]).includes(params.category)) {
        throw notFound()
      }
      return { category: params.category as BenchmarkCategory }
    },
  },
  validateSearch: z.object({
    sort: sortParam(RANKINGS_SORT_KEYS, '-index'),
    q: textQueryParam,
    org: orgParam,
    open: openFilterParam,
  }),
  search: { middlewares: [stripSearchParams({ sort: '-index', q: '', org: 'all', open: 'all' })] },
  head: ({ params }) => ({
    meta: [{ title: `${params.category} rankings · RankedModel` }],
  }),
  component: CategoryRankingsRoute,
})

function CategoryRankingsRoute() {
  const { category } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <RankingsScreen
      search={search}
      category={category}
      navigateSearch={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: 'q' in patch })
      }
    />
  )
}
