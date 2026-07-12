import { env } from 'cloudflare:workers'
import * as schema from '@rankedmodel/db'
import { drizzle } from 'drizzle-orm/d1'

/**
 * D1 access with the Sessions API (arch §6): public reads are served by the nearest
 * replica via `first-unconstrained`. Drizzle has no first-class session support
 * (drizzle-orm#4522); a D1DatabaseSession exposes the same `prepare`/`batch` surface the
 * D1 driver calls, so the cast below is safe. If it ever breaks, the one-line revert is
 * `drizzle(env.DB, { schema })`.
 */
export function getDb() {
  const session = env.DB.withSession('first-unconstrained')
  return drizzle(session as unknown as D1Database, { schema })
}

export { schema }
