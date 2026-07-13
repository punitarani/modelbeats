import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  type BenchmarkBounds,
  type BenchmarkCategory,
  categoryFractions,
  computeMovers,
  isRankEligible,
  type Mover,
  overallIndex,
  type ResultSource,
  rankByIndex,
  toIndexScale,
} from '@rankedmodel/shared'
import { loadDataset } from './lib/load'

/**
 * Publish-time derivation (C1): validate must have passed first. Emits
 * data/derived/scores.json — committed, deterministic (no wall-clock timestamps;
 * `computedFor` is the dataset's as-of date), reviewable as a diff.
 */

/** When a model×benchmark has rows from several sources, this order picks the headline. */
const HEADLINE_SOURCE_PRECEDENCE: ResultSource[] = [
  'independent',
  'arena',
  'admin-run',
  'curated',
  'self-reported',
]

export interface DerivedModelScore {
  slug: string
  overallIndex: number
  /** Overall rank among rank-eligible models (D20); null when the model is unrated. */
  rankOverall: number | null
  /** Has enough benchmark coverage to earn a rank (D20). */
  ranked: boolean
  arenaElo: number | null
  categoryIdx: Record<BenchmarkCategory, number | null>
}

export interface DerivedScores {
  computedFor: string
  models: DerivedModelScore[]
  movers: Mover[]
}

export async function deriveScores(root: string): Promise<DerivedScores> {
  const ds = await loadDataset(root)
  if (ds.errors.length > 0) {
    throw new Error(`dataset has ${ds.errors.length} validation errors — run validate first`)
  }

  const bounds: BenchmarkBounds[] = ds.benchmarks.map((b) => ({
    slug: b.slug,
    category: b.category,
    normMin: b.normMin,
    normMax: b.normMax,
  }))

  // headline score per (model, benchmark) with source precedence
  const headline = new Map<string, Record<string, number>>()
  for (const [benchSlug, rows] of ds.results) {
    for (const r of rows) {
      const scores = headline.get(r.modelSlug) ?? {}
      const existing = scores[benchSlug]
      if (existing == null) {
        scores[benchSlug] = r.score
      } else {
        const prevRow = rows.find((x) => x.modelSlug === r.modelSlug && x.score === existing)
        const prevRank = HEADLINE_SOURCE_PRECEDENCE.indexOf(prevRow?.source ?? 'self-reported')
        if (HEADLINE_SOURCE_PRECEDENCE.indexOf(r.source) < prevRank) scores[benchSlug] = r.score
      }
      headline.set(r.modelSlug, scores)
    }
  }

  const indexed = ds.models.map((m) => {
    const scores = headline.get(m.slug) ?? {}
    return {
      model: m,
      scores,
      index: overallIndex(scores, bounds),
      ranked: isRankEligible(scores, bounds),
    }
  })

  // Rank only rank-eligible models (D20); unrated models get no rank.
  const ranks = rankByIndex(
    indexed.filter((x) => x.ranked).map((x) => ({ slug: x.model.slug, index: x.index })),
  )

  const models: DerivedModelScore[] = indexed
    .map(({ model, scores, index, ranked }) => {
      const fractions = categoryFractions(scores, bounds)
      const categoryIdx = Object.fromEntries(
        Object.entries(fractions).map(([cat, f]) => [cat, toIndexScale(f)]),
      ) as Record<BenchmarkCategory, number | null>
      return {
        slug: model.slug,
        overallIndex: index,
        rankOverall: ranked ? (ranks.get(model.slug) ?? null) : null,
        ranked,
        arenaElo: scores.arena ?? null,
        categoryIdx,
      }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))

  const indexBySlug = new Map(indexed.map((x) => [x.model.slug, x.index]))
  const rankedBySlug = new Map(indexed.map((x) => [x.model.slug, x.ranked]))
  const movers = computeMovers(
    ds.models.map((m) => ({
      slug: m.slug,
      name: m.name,
      predecessor: m.predecessor,
      index: indexBySlug.get(m.slug) ?? 0,
      ranked: rankedBySlug.get(m.slug) ?? false,
    })),
  )

  return { computedFor: ds.meta?.asOfIso ?? 'unknown', models, movers }
}

if (import.meta.main) {
  const root = process.argv[2] ?? 'data'
  const derived = await deriveScores(root)
  const outDir = join(root, 'derived')
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'scores.json'), `${JSON.stringify(derived, null, 2)}\n`)
  const top = derived.models.find((m) => m.rankOverall === 1)
  console.log(
    `✓ derived ${derived.models.length} model scores → ${outDir}/scores.json · #1 ${top?.slug} (${top?.overallIndex}) · ${derived.movers.length} movers`,
  )
}
