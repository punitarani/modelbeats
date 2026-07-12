import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { buildSnapshot } from './snapshot'

/**
 * Performance budgets (arch §10), enforced in `bun run ci` after the build:
 *   1. largest client JS chunk < 200 KB gz (initial-route budget)
 *   2. catalog snapshot < 1.5 MB gz (also enforced at publish)
 *   3. Worker bundle < 3 MB gz (Cloudflare free-plan limit; measured via dry-run)
 * Override caps for guard-proof testing: BUDGET_CLIENT_KB / BUDGET_WORKER_KB.
 */

const WEB_DIR = resolve(import.meta.dirname, '..', '..', 'apps', 'web')
const CLIENT_BUDGET_KB = Number(process.env.BUDGET_CLIENT_KB ?? 200)
const WORKER_BUDGET_KB = Number(process.env.BUDGET_WORKER_KB ?? 3 * 1024)
const SNAPSHOT_BUDGET_KB = 1.5 * 1024

let failed = false
const check = (label: string, actualKb: number, budgetKb: number) => {
  const ok = actualKb <= budgetKb
  if (!ok) failed = true
  console.log(`${ok ? '✓' : '✗'} ${label}: ${actualKb.toFixed(1)} KB gz (budget ${budgetKb} KB)`)
}

// 1. client chunks
const assetsDir = join(WEB_DIR, 'dist', 'client', 'assets')
const chunks = readdirSync(assetsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => ({ f, kb: gzipSync(readFileSync(join(assetsDir, f))).length / 1024 }))
  .sort((a, b) => b.kb - a.kb)
const biggest = chunks[0]
if (!biggest) throw new Error('no client chunks found — run the build first')
check(`largest client chunk (${biggest.f})`, biggest.kb, CLIENT_BUDGET_KB)

// 2. snapshot
const snapshot = await buildSnapshot('data', 1)
check('catalog snapshot', gzipSync(JSON.stringify(snapshot)).length / 1024, SNAPSHOT_BUDGET_KB)

// 3. worker bundle via wrangler dry-run (no credentials needed)
const dry = spawnSync(
  'bunx',
  ['wrangler', 'deploy', '--dry-run', '--outdir', '.wrangler/tmp/dry-run'],
  { cwd: WEB_DIR, encoding: 'utf8' },
)
const out = `${dry.stdout}\n${dry.stderr}`
const m = out.match(/gzip:\s*([\d.]+)\s*(KiB|MiB)/i)
if (!m) {
  console.error(out.slice(-600))
  throw new Error('could not parse gzip size from wrangler deploy --dry-run')
}
const workerKb = Number(m[1]) * (m[2]?.toLowerCase() === 'mib' ? 1024 : 1)
check('worker bundle (dry-run)', workerKb, WORKER_BUDGET_KB)

if (failed) {
  console.error('\nbudget exceeded — see arch §10 / plan C7')
  process.exit(1)
}
console.log('\nall budgets green')
