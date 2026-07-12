import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

/** Spine-proof harness test: real workerd, real D1/KV semantics. */
describe('workers bindings harness', () => {
  it('KV round-trips JSON through the CATALOG binding', async () => {
    await env.CATALOG.put('test:harness', JSON.stringify({ ok: true, n: 1 }))
    expect(await env.CATALOG.get('test:harness', 'json')).toEqual({ ok: true, n: 1 })
  })

  it('D1 carries the migrated schema', async () => {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('models','benchmarks','meta','model_scores')",
    ).all<{ name: string }>()
    expect(tables.results.map((t) => t.name).sort()).toEqual([
      'benchmarks',
      'meta',
      'model_scores',
      'models',
    ])
  })

  it('D1 accepts idempotent upserts (the seed pattern)', async () => {
    const upsert =
      "INSERT INTO organizations (id, slug, name, type) VALUES (1, 'test-org', 'Test Org', 'lab') ON CONFLICT(id) DO UPDATE SET name=excluded.name"
    await env.DB.prepare(upsert).run()
    await env.DB.prepare(upsert.replace('Test Org', 'Renamed Org')).run()
    const row = await env.DB.prepare(
      'SELECT COUNT(*) AS n, MAX(name) AS name FROM organizations',
    ).first<{ n: number; name: string }>()
    expect(row).toEqual({ n: 1, name: 'Renamed Org' })
  })
})
