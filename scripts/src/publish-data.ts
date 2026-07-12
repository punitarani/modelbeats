import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { deriveScores } from './derive'
import { seed } from './seed'
import { publishSnapshot } from './snapshot'
import { validateData } from './validate'

/**
 * Publish pipeline (ARCHITECTURE §5): validate → derive → seed D1 → snapshot to KV +
 * version bump. Invalidation IS the version bump — every downstream cache key changes.
 */

const target = process.argv.includes('--remote') ? ('--remote' as const) : ('--local' as const)
const root = process.argv[2]?.startsWith('--') ? 'data' : (process.argv[2] ?? 'data')

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

// 3. seed D1
await seed(root, target)

// 4. snapshot → KV + meta.data_version bump (= global cache invalidation)
await publishSnapshot(root, target)
