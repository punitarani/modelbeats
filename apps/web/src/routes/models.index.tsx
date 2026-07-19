import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { ExplorerScreen } from '#/components/explorer/explorer-screen'
import { EXPLORER_SEARCH_DEFAULTS, explorerSearchSchema } from '#/lib/search'

export const Route = createFileRoute('/models/')({
  validateSearch: explorerSearchSchema,
  search: { middlewares: [stripSearchParams(EXPLORER_SEARCH_DEFAULTS)] },
  head: () => ({
    meta: [
      { title: 'Model Explorer · Model Beats' },
      {
        name: 'description',
        content: 'Filter every tracked LLM by openness, size, capabilities and your hardware.',
      },
    ],
  }),
  component: ExplorerRoute,
})

function ExplorerRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <ExplorerScreen
      search={search}
      navigateSearch={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: 'q' in patch })
      }
    />
  )
}
