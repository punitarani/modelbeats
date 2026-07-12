import { queryOptions } from '@tanstack/react-query'
import { getCatalog } from '#/server/functions'

/**
 * The catalog snapshot query (C7): SSR-hydrated via the router-query integration,
 * immutable per session (staleTime ∞) — a publish bumps the version server-side and
 * naturally reaches clients on their next full load.
 */
export const catalogQueryOptions = queryOptions({
  queryKey: ['catalog'],
  queryFn: () => getCatalog(),
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
})
