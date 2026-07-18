import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { deriveScores } from './derive'
import { seed } from './seed'
import { publishSnapshot } from './snapshot'
import { validateData } from './validate'

/**
 * Publish pipeline (ARCHITECTURE §5): validate → derive → migrate → seed D1 → snapshot to
 * KV + version bump. Invalidation IS the version bump — every downstream cache key changes.
 */

const target = process.argv.includes('--remote') ? ('--remote' as const) : ('--local' as const)
const root = process.argv[2]?.startsWith('--') ? 'data' : (process.argv[2] ?? 'data')

const WEB_DIR = resolve(import.meta.dirname, '..', '..', 'apps', 'web')

/**
 * Apply pending D1 migrations before seeding — `seed` upserts into tables that must
 * already exist. Idempotent: wrangler skips migrations already recorded in `d1_migrations`,
 * so this is a no-op on an up-to-date database (and the redundant call from deploy.ts,
 * which migrates first for code-vs-schema ordering, costs nothing). `--env` is threaded
 * for --remote exactly as seed/snapshot do it.
 */
function migrate(to: '--local' | '--remote'): void {
  const envFlag =
    to === '--remote' && process.env.RANKEDMODEL_ENV ? ['--env', process.env.RANKEDMODEL_ENV] : []
  const res = spawnSync('bunx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', to, ...envFlag], {
    cwd: WEB_DIR,
    stdio: 'inherit',
  })
  if (res.status !== 0) {
    console.error(`✗ migrations apply failed (exit ${res.status}) — aborting publish`)
    process.exit(res.status ?? 1)
  }
}

// 1. validate — bad data cannot ship
const report = await validateData(root)
if (report.errors.length > 0) {
  console.error(`✗ validation failed with ${report.errors.length} error(s):`)
  for (const e of report.errors) console.error(`  - ${e}`)
  process.exit(1)
}
const st = report.stats
console.log(
  `✓ validated — ${st.models} models · ${st.organizations} orgs · ${st.benchmarks} benchmarks · ${st.results} results`,
)

// 2. derive — refresh the committed, reviewable scores file
const derived = await deriveScores(root)
await mkdir(join(root, 'derived'), { recursive: true })
await writeFile(join(root, 'derived', 'scores.json'), `${JSON.stringify(derived, null, 2)}\n`)
console.log(`✓ derived scores (#1: ${derived.models.find((m) => m.rankOverall === 1)?.slug})`)

// 3. migrate — bring the D1 schema up to date before seeding into it
migrate(target)

// 4. seed D1
await seed(root, target)

// 5. snapshot → KV + meta.data_version bump (= global cache invalidation)
await publishSnapshot(root, target)
