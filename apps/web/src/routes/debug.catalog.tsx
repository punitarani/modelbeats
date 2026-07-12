import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { catalogQueryOptions } from '#/lib/catalog'

/**
 * Spine-proof route (plan commit 14): SSR-renders catalog counts straight from the
 * KV/D1 spine. If `curl /debug/catalog` shows the model count, the whole pipeline —
 * wrangler-CLI-seeded local state → vite-plugin workerd → server fn → Query SSR —
 * is proven end to end.
 */
export const Route = createFileRoute('/debug/catalog')({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  component: DebugCatalog,
})

function DebugCatalog() {
  const { data } = useSuspenseQuery(catalogQueryOptions)
  const orgs = new Set(data.models.map((m) => m.orgSlug)).size
  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="text-lg font-semibold">catalog spine</h1>
      <p data-testid="catalog-counts" className="mt-2">
        v{data.version} · {data.models.length} models · {orgs} orgs · {data.benchmarks.length}{' '}
        benchmarks · {data.gpus.length} gpus · as of {data.asOf}
      </p>
      <p className="mt-1">
        #1: {data.models.find((m) => m.rank === 1)?.name} (
        {data.models.find((m) => m.rank === 1)?.index})
      </p>
    </main>
  )
}
