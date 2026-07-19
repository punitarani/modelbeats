import { type ModelDetail, type ModelDetailsMap, normalizeScore } from '@rankedmodel/shared'
import type { Dataset } from './lib/load'

/**
 * Build the deep per-model detail map from the curated dataset — the same payload the old
 * D1 `loadModel` returned, now computed at build time and served in-memory. One entry per
 * model, keyed by slug.
 *
 * Mirrors the derivations the seeder applied (scripts/src/seed.ts): quantization bits/VRAM
 * from the model's `quants` list, `score_normalized` via the shared C1 formula, and the
 * predecessor/successor lineage from `predecessor` back-references.
 */

// Nominal bits-per-weight per quant method (was the seed's BITS table).
const QUANT_BITS: Record<string, number> = {
  'GGUF Q4': 4.5,
  'GGUF Q8': 8.5,
  MXFP4: 4,
  NVFP4: 4,
  FP8: 8,
  AWQ: 4,
  GPTQ: 4,
  EXL2: 4.5,
  MLX: 4.5,
  '1.58-bit dynamic': 1.58,
  '1.8-bit dynamic': 1.8,
}

export function buildModelDetails(ds: Dataset): ModelDetailsMap {
  const benchBySlug = new Map(ds.benchmarks.map((b) => [b.slug, b]))
  const hardwareBySlug = new Map(ds.hardware.map((h) => [h.slug, h]))
  const effectiveDateFallback = ds.meta?.asOfIso ?? '1970-01-01'

  // successors: slug → its immediate successors (models whose predecessor is this slug)
  const successorsBySlug = new Map<string, string[]>()
  for (const m of ds.models) {
    if (!m.predecessor) continue
    const list = successorsBySlug.get(m.predecessor) ?? []
    list.push(m.slug)
    successorsBySlug.set(m.predecessor, list)
  }

  // results grouped by model, carrying benchmark bounds for the C1 normalization
  const resultsByModel = new Map<string, ModelDetail['results']>()
  for (const [benchSlug, rows] of ds.results) {
    const bench = benchBySlug.get(benchSlug)
    if (!bench) continue
    for (const r of rows) {
      const list = resultsByModel.get(r.modelSlug) ?? []
      list.push({
        benchmarkSlug: benchSlug,
        score: r.score,
        scoreNormalized: normalizeScore(
          {
            slug: bench.slug,
            category: bench.category,
            normMin: bench.normMin,
            normMax: bench.normMax,
          },
          r.score,
        ),
        source: r.source,
        sourceUrl: r.sourceUrl ?? null,
        evaluatedAt: r.evaluatedAt ?? null,
        isVerified: false,
        notes: r.notes ?? null,
      })
      resultsByModel.set(r.modelSlug, list)
    }
  }

  // throughput + pricing grouped by model
  const throughputByModel = new Map<string, ModelDetail['throughput']>()
  for (const t of ds.throughput) {
    const list = throughputByModel.get(t.modelSlug) ?? []
    list.push({
      hardwareSlug: t.hardwareSlug,
      hardwareName: hardwareBySlug.get(t.hardwareSlug)?.name ?? '',
      quantMethod: t.quantMethod,
      framework: t.framework,
      tokensPerSec: t.tokensPerSec,
      contextTested: t.contextTested ?? null,
    })
    throughputByModel.set(t.modelSlug, list)
  }
  const pricingByModel = new Map<string, ModelDetail['pricing']>()
  for (const p of ds.pricing) {
    const list = pricingByModel.get(p.modelSlug) ?? []
    list.push({
      provider: p.provider,
      inputPerMtok: p.inputPerMtok,
      outputPerMtok: p.outputPerMtok,
      effectiveDate: p.effectiveDate ?? effectiveDateFallback,
    })
    pricingByModel.set(p.modelSlug, list)
  }

  const out: ModelDetailsMap = {}
  for (const m of ds.models) {
    const results = (resultsByModel.get(m.slug) ?? []).sort(
      (a, z) => a.benchmarkSlug.localeCompare(z.benchmarkSlug) || a.source.localeCompare(z.source),
    )
    const quantizations = m.quants.map((method) => ({
      method,
      bits: QUANT_BITS[method] ?? null,
      // Curated ground truth is only attached to GGUF Q4 (matches the seeder).
      minVramGb: method === 'GGUF Q4' ? (m.vramQ4Gb ?? null) : null,
      diskSizeGb: null,
    }))
    out[m.slug] = {
      slug: m.slug,
      results,
      quantizations,
      throughput: throughputByModel.get(m.slug) ?? [],
      pricing: pricingByModel.get(m.slug) ?? [],
      lineage: {
        predecessor: m.predecessor ?? null,
        successors: (successorsBySlug.get(m.slug) ?? []).sort((a, z) => a.localeCompare(z)),
      },
    }
  }
  return out
}
