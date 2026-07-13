import { type CatalogSnapshot, computeMovers, type SnapshotModel } from '@rankedmodel/shared'

/** Display shaping for the dashboard (design renderVals, snapshot-only per D17). */

export function dashboardStats(catalog: CatalogSnapshot) {
  const models = catalog.models
  const openModels = models.filter((m) => m.open)
  const asOf = new Date(`${catalog.asOfIso}T00:00:00Z`).getTime()
  const recent90d = models.filter(
    (m) => (asOf - new Date(`${m.date}T00:00:00Z`).getTime()) / 86_400_000 < 90,
  ).length
  const byIndex = [...models].sort((a, b) => b.index - a.index)
  const openBest = byIndex.find((m) => m.open)
  const closedBest = byIndex.find((m) => !m.open)
  const gapElo =
    openBest?.bench.arena != null && closedBest?.bench.arena != null
      ? (closedBest.bench.arena as number) - (openBest.bench.arena as number)
      : null
  return {
    modelCount: models.length,
    orgCount: new Set(models.map((m) => m.orgSlug)).size,
    openCount: openModels.length,
    openPct: Math.round((openModels.length / Math.max(1, models.length)) * 100),
    recent90d,
    gapElo,
    openBest,
    closedBest,
  }
}

export function latestReleases(catalog: CatalogSnapshot, n = 8): SnapshotModel[] {
  return [...catalog.models].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n)
}

export function arenaTop(catalog: CatalogSnapshot, n = 8): SnapshotModel[] {
  return catalog.models
    .filter((m) => m.bench.arena != null)
    .sort((a, b) => (b.bench.arena as number) - (a.bench.arena as number))
    .slice(0, n)
}

export function dashboardMovers(catalog: CatalogSnapshot) {
  return computeMovers(
    catalog.models.map((m) => ({
      slug: m.slug,
      name: m.name,
      predecessor: m.predecessor,
      index: m.index,
    })),
  )
}

/**
 * Scatter points worth labeling directly on the chart: the top few models by index (the
 * frontier, regardless of openness) plus the top open-weights model if it didn't already
 * make that cut — derived from live data instead of a fixed slug list (D-real).
 */
export function scatterLabeled(catalog: CatalogSnapshot, topN = 5): Set<string> {
  const priced = catalog.models.filter((m) => m.price && m.bench.arena != null)
  const byIndex = [...priced].sort((a, b) => b.index - a.index)
  const labeled = new Set(byIndex.slice(0, topN).map((m) => m.slug))
  const topOpen = byIndex.find((m) => m.open)
  if (topOpen) labeled.add(topOpen.slug)
  return labeled
}
