import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import type { SoftwareApplication, WithContext } from 'schema-dts'
import { ModelDetailScreen } from '#/components/model-detail/model-detail-screen'
import { catalogQueryOptions } from '#/lib/catalog'
import { modelQueryOptions } from '#/lib/model'
import { SITE_ORIGIN, seoMeta } from '#/lib/seo'

export const Route = createFileRoute('/models/$slug')({
  loader: async ({ context, params }) => {
    const [catalog, detail] = await Promise.all([
      context.queryClient.ensureQueryData(catalogQueryOptions),
      context.queryClient.ensureQueryData(modelQueryOptions(params.slug)),
    ])
    const model = catalog.models.find((m) => m.slug === params.slug)
    if (!detail || !model) throw notFound()
    // head() input for canonical/OG/JSON-LD
    return {
      name: model.name,
      note: model.note,
      date: model.date,
      org: model.org,
      license: model.license,
    }
  },
  head: ({ params, loaderData }) => {
    const base = seoMeta({
      title: `${loaderData?.name ?? params.slug} — benchmarks, pricing & hardware fit · Model Beats`,
      description: loaderData?.note ?? 'Model detail on Model Beats.',
      path: `/models/${params.slug}`,
    })
    return {
      ...base,
      scripts: loaderData
        ? [
            {
              type: 'application/ld+json',
              children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: loaderData.name,
                applicationCategory: 'Large language model',
                datePublished: loaderData.date,
                creator: { '@type': 'Organization', name: loaderData.org },
                url: `${SITE_ORIGIN}/models/${params.slug}`,
                license: loaderData.license,
              } satisfies WithContext<SoftwareApplication>),
            },
          ]
        : [],
    }
  },
  notFoundComponent: () => (
    <div className="py-16 text-center text-[13px] text-mut">
      Model not found. <Link to="/models">Back to explorer</Link>
    </div>
  ),
  component: ModelDetailRoute,
})

function ModelDetailRoute() {
  const { slug } = Route.useParams()
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions)
  const model = catalog.models.find((m) => m.slug === slug)
  if (!model) throw notFound()
  return <ModelDetailScreen model={model} catalog={catalog} />
}
