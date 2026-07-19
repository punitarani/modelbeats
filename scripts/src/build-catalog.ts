import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { modelDetailsMapSchema } from '@rankedmodel/shared'
import { deriveScores } from './derive'
import { loadDataset } from './lib/load'
import { buildModelDetails } from './model-details'
import { buildSnapshot } from './snapshot'
import { validateData } from './validate'

/**
 * Build pipeline (ARCHITECTURE §5): validate → derive → build the two serving artifacts
 * (headline catalog snapshot + deep per-model details) → write them to the app's generated
 * dir. There is no database and no store: the artifacts are bundled into the Worker at
 * `vite build` and served from the edge cache. Run before typecheck/build/test/dev.
 */

const root = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'data'
const GENERATED_DIR = resolve(import.meta.dirname, '..', '..', 'apps', 'web', 'src', 'generated')

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

// 3. build the two serving artifacts straight from the curated data
const catalog = await buildSnapshot(root)
const ds = await loadDataset(root)
const details = modelDetailsMapSchema.parse(buildModelDetails(ds))

// 4. write them into the app's generated dir (gitignored; bundled at vite build)
await mkdir(GENERATED_DIR, { recursive: true })
await writeFile(join(GENERATED_DIR, 'catalog.json'), JSON.stringify(catalog))
await writeFile(join(GENERATED_DIR, 'model-details.json'), JSON.stringify(details))
console.log(
  `✓ built catalog v${catalog.version} (${catalog.models.length} models) + ${Object.keys(details).length} model-detail entries → apps/web/src/generated/`,
)
