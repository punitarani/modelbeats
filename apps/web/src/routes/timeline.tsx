import { createFileRoute, redirect } from '@tanstack/react-router'

/** D6 fold: the releases feed covers the timeline need; the zoomable swim-lane view is post-v1. */
export const Route = createFileRoute('/timeline')({
  beforeLoad: () => {
    throw redirect({ to: '/', search: { tab: 'releases' } })
  },
})
