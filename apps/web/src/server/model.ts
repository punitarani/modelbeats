import type { ModelDetail, ModelDetailsMap } from '@modelbeats/shared'
import detailsData from '#/generated/model-details.json'

/**
 * Deep model payload (contract C3b): full multi-source results with provenance,
 * quantizations, throughput, pricing and lineage — the detail deliberately kept out of the
 * headline snapshot. Built from `data/**` at `bun run build-catalog` and bundled into the
 * Worker; looked up in-memory by slug. Was the second D1 read path; now a static artifact.
 */
const details = detailsData as ModelDetailsMap

export type { ModelDetail }

export function loadModel(slug: string): ModelDetail | null {
  return details[slug] ?? null
}
