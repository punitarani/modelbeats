import { createHash } from 'node:crypto'
import {
  type CatalogSnapshot,
  catalogSnapshotSchema,
  pickHeadlineRow,
  type ResultSource,
} from '@modelbeats/shared'
import { deriveScores } from './derive'
import { loadDataset } from './lib/load'

/**
 * Catalog snapshot builder (contract C3). Builds the headline catalog JSON straight from
 * the curated `data/**` files (never a database), parses it back through the shared Zod
 * contract (a malformed snapshot cannot ship), and stamps a content-derived `version`.
 *
 * The version is a stable hash of the snapshot's data: it changes iff the data changes,
 * which is exactly what keys the immutable `/api/catalog/v{N}.json` cache. No counter, no
 * database — the deploy that ships new data ships a new version.
 */

/** Deterministic positive-integer version from the snapshot's data (excludes `version`). */
function contentVersion(data: Omit<CatalogSnapshot, 'version'>): number {
  const hex = createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 8)
  return Math.max(1, Number.parseInt(hex, 16))
}

export async function buildSnapshot(root: string): Promise<CatalogSnapshot> {
  const ds = await loadDataset(root)
  if (ds.errors.length > 0) {
    throw new Error(`dataset invalid (${ds.errors.length} errors) — run validate-data first`)
  }
  const derived = await deriveScores(root)
  const scoreBySlug = new Map(derived.models.map((m) => [m.slug, m]))
  const orgBySlug = new Map(ds.organizations.map((o) => [o.slug, o]))
  const familyBySlug = new Map(ds.families.map((f) => [f.slug, f]))

  // headline scores + their provenance per model (same precedence as derive)
  const bench = new Map<string, Record<string, number | null>>()
  const benchSources = new Map<string, Record<string, ResultSource>>()
  for (const [benchSlug, rows] of ds.results) {
    const byModel = new Map<string, { score: number; source: ResultSource }[]>()
    for (const r of rows) {
      if (!byModel.has(r.modelSlug)) byModel.set(r.modelSlug, [])
      byModel.get(r.modelSlug)?.push({ score: r.score, source: r.source })
    }
    for (const [modelSlug, modelRows] of byModel) {
      const head = pickHeadlineRow(modelRows)
      if (!head) continue
      const scores = bench.get(modelSlug) ?? {}
      scores[benchSlug] = head.score
      bench.set(modelSlug, scores)
      const sources = benchSources.get(modelSlug) ?? {}
      sources[benchSlug] = head.source
      benchSources.set(modelSlug, sources)
    }
  }

  const data: Omit<CatalogSnapshot, 'version'> = {
    asOf: ds.meta?.asOf ?? 'unknown',
    asOfIso: ds.meta?.asOfIso ?? '1970-01-01',
    benchmarks: ds.benchmarks.map((b) => ({
      slug: b.slug,
      name: b.name,
      category: b.category,
      unit: b.unit,
      description: b.description,
      normMin: b.normMin,
      normMax: b.normMax,
    })),
    gpus: ds.hardware.map((g) => ({
      slug: g.slug,
      name: g.name,
      kind: g.kind,
      vramGb: g.vramGb,
    })),
    models: [...ds.models]
      .sort((a, z) => a.slug.localeCompare(z.slug))
      .map((m) => {
        const score = scoreBySlug.get(m.slug)
        if (!score) throw new Error(`no derived score for ${m.slug}`)
        return {
          slug: m.slug,
          name: m.name,
          org: orgBySlug.get(m.orgSlug)?.name ?? m.orgSlug,
          orgSlug: m.orgSlug,
          family: familyBySlug.get(m.familySlug)?.name ?? m.familySlug,
          familySlug: m.familySlug,
          date: m.releaseDate,
          status: m.status,
          openness: m.openness,
          open: m.openness !== 'closed',
          predecessor: m.predecessor,
          params: m.paramsB,
          active: m.activeParamsB,
          ctxK: m.ctxK,
          arch: m.archDisplay,
          archClass: m.archClass,
          license: m.license,
          langCount: m.langCount,
          modalities: m.modalities,
          caps: m.capabilities,
          apiAvailable: m.apiAvailable,
          bench: bench.get(m.slug) ?? {},
          benchSources: benchSources.get(m.slug) ?? {},
          price: m.price,
          vramQ4: m.vramQ4Gb,
          vramFp16: m.vramFp16Gb,
          quants: m.quants,
          tps4090: m.tps4090,
          tpsNote: m.tpsNote,
          effortLabel: m.effortLabel,
          isDefaultConfig: m.isDefaultConfig,
          isBestConfig: m.isBestConfig,
          links: m.links,
          note: m.note,
          index: score.overallIndex,
          rank: score.rankOverall,
          ranked: score.ranked,
          categoryIdx: score.categoryIdx,
        }
      }),
  }

  // The contract check: a snapshot that doesn't parse cannot ship.
  return catalogSnapshotSchema.parse({ version: contentVersion(data), ...data })
}
