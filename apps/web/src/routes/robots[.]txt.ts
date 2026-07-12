import { createFileRoute } from '@tanstack/react-router'
import { SITE_ORIGIN } from '#/lib/seo'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `User-agent: *\nAllow: /\nDisallow: /debug/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
          { headers: { 'content-type': 'text/plain' } },
        ),
    },
  },
})
