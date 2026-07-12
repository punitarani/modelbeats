import { env } from 'cloudflare:workers'
import { catalogKey } from '@rankedmodel/shared'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Versioned, immutable catalog JSON (C7): /api/catalog/v{N}.json. Snapshot blobs never
 * change once published, so the browser/edge may cache forever — invalidation is a new
 * version number, never a purge.
 */
export const Route = createFileRoute('/api/catalog/v{$version}.json')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const version = Number(params.version)
        if (!Number.isInteger(version) || version < 1) {
          return new Response('invalid version', { status: 400 })
        }
        const body = await env.CATALOG.get(catalogKey(version), 'stream')
        if (!body) return new Response('unknown catalog version', { status: 404 })
        return new Response(body, {
          headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=31536000, immutable',
            'x-data-version': String(version),
          },
        })
      },
    },
  },
})
