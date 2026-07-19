import { type CatalogSnapshot, catalogSnapshotSchema } from '@modelbeats/shared'
import catalogData from '#/generated/catalog.json'

/**
 * The catalog spine (contract C3): the headline snapshot is built from `data/**` at
 * `bun run build-catalog` and bundled into the Worker. No database, no KV, no I/O — the
 * snapshot is parsed once here (the contract check: a malformed build cannot serve) and
 * held in memory. Every screen's selectors consume this.
 */
const catalog: CatalogSnapshot = catalogSnapshotSchema.parse(catalogData)

export function loadCatalog(): CatalogSnapshot {
  return catalog
}
