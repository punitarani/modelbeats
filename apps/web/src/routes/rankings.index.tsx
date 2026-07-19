import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { RankingsScreen } from '#/components/rankings/rankings-screen'
import {
  openFilterParam,
  orgParam,
  RANKINGS_SORT_KEYS,
  sortParam,
  textQueryParam,
} from '#/lib/search'
import { seoMeta } from '#/lib/seo'

const rankingsSearchSchema = z.object({
  sort: sortParam(RANKINGS_SORT_KEYS, '-index'),
  q: textQueryParam,
  org: orgParam,
  open: openFilterParam,
})

export const Route = createFileRoute('/rankings/')({
  validateSearch: rankingsSearchSchema,
  search: { middlewares: [stripSearchParams({ sort: '-index', q: '', org: 'all', open: 'all' })] },
  head: () =>
    seoMeta({
      title: 'Global LLM Rankings · Model Beats',
      description:
        'Every tracked language model ranked by normalized index and per-benchmark scores.',
      path: '/rankings',
    }),
  component: RankingsRoute,
})

function RankingsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <RankingsScreen
      search={search}
      navigateSearch={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: 'q' in patch })
      }
    />
  )
}
