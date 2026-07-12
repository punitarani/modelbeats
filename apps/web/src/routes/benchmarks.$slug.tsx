import { createFileRoute } from '@tanstack/react-router'
import { Placeholder } from '#/components/shell/placeholder'

export const Route = createFileRoute('/benchmarks/$slug')({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} · RankedModel` }] }),
  component: () => (
    <Placeholder
      title="Benchmark"
      note="Leaderboard + distribution land with the benchmarks commit."
    />
  ),
})
