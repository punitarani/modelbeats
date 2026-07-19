import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

/**
 * Credential-gated production deploy. Builds the catalog + model-detail artifacts from
 * data/**, builds the Worker (which bundles them), and deploys. There is no D1, no KV and
 * no migrations — nothing to provision. Runs from a human's shell for the first deploy,
 * then from GitHub Actions CD on every merge to main. See docs/DEPLOY.md.
 *
 *   bun run deploy:production   build-catalog → vite build → wrangler deploy
 */

if (process.argv[2] !== 'production') {
  console.error('usage: bun scripts/src/deploy.ts production')
  process.exit(1)
}

if (!process.env.CLOUDFLARE_API_TOKEN && !process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error(`✗ No Cloudflare credentials in the environment.

This deploy is credential-gated on purpose. To ship production:
  1. Create a scoped API token with the Workers Scripts · Edit permission.
  2. Export CLOUDFLARE_API_TOKEN (and CLOUDFLARE_ACCOUNT_ID if the token spans accounts),
     then rerun this command.

Full runbook: docs/DEPLOY.md`)
  process.exit(1)
}

const ROOT = resolve(import.meta.dirname, '..', '..')
const WEB_DIR = resolve(ROOT, 'apps', 'web')
const run = (cmd: string, args: string[], cwd: string) => {
  console.log(`\n$ ${cmd} ${args.join(' ')}`)
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env })
  if (res.status !== 0) {
    console.error(`✗ step failed (exit ${res.status}) — aborting deploy`)
    process.exit(res.status ?? 1)
  }
}

// 1. build the serving artifacts (catalog + per-model detail) from data/**
run('bun', ['scripts/src/build-catalog.ts'], ROOT)
// 2. build the Worker (bundles the artifacts) and deploy it
run('bunx', ['vite', 'build'], WEB_DIR)
run('bunx', ['wrangler', 'deploy'], WEB_DIR)

console.log(
  '\n✓ production deployed. The bundled snapshot IS the version — nothing to publish or purge.',
)
