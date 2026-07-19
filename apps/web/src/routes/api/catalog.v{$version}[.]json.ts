import { createFileRoute } from '@tanstack/react-router'

/**
 * Versioned, immutable catalog JSON (C7): /api/catalog/v{N}.json. The snapshot is bundled
 * at build time and its `version` is content-derived, so any given URL is immutable — a
 * data change ships a new version, hence a new URL. The app itself reads the catalog via
 * the `getCatalog` server fn; this route is the external / SEO surface.
 */
export const Route = createFileRoute('/api/catalog/v{$version}.json')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const version = Number(params.version)
        if (!Number.isInteger(version) || version < 1) {
          return new Response('invalid version', { status: 400 })
        }
        const { loadCatalog } = await import('#/server/catalog')
        const catalog = loadCatalog()
        return new Response(JSON.stringify(catalog), {
          headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=31536000, immutable',
            'x-data-version': String(catalog.version),
          },
        })
      },
    },
  },
})
