/** SEO helpers (arch §6): canonical + OG/twitter meta and the site origin. */

export const SITE_ORIGIN = 'https://rankedmodel.com'
export const SITE_NAME = 'RankedModel'

export function seoMeta(opts: { title: string; description: string; path: string }) {
  const url = `${SITE_ORIGIN}${opts.path}`
  return {
    meta: [
      { title: opts.title },
      { name: 'description', content: opts.description },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: opts.title },
      { property: 'og:description', content: opts.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: opts.title },
      { name: 'twitter:description', content: opts.description },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
