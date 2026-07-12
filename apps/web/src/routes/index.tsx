import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const getServerInfo = createServerFn().handler(() => ({
  renderedAt: new Date().toISOString(),
  runtime: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
}))

export const Route = createFileRoute('/')({
  loader: () => getServerInfo(),
  component: Home,
})

function Home() {
  const info = Route.useLoaderData()
  return (
    <main className="p-8 font-mono text-sm">
      <h1 data-ssr="true" className="text-xl font-semibold">
        RankedModel
      </h1>
      <p className="mt-2">
        SSR ok — rendered {info.renderedAt} · runtime: {info.runtime}
      </p>
    </main>
  )
}
