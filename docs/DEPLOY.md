# Deploy Runbook

> Everything in this repo runs and verifies **fully locally** (miniflare state in
> `apps/web/.wrangler/state`). Production is a single Cloudflare environment. The first
> deploy is manual (to prove the resources and token); after that, **GitHub Actions CD**
> ships every push to `main` that passes CI + e2e.

## Topology

- **One environment: `production`** — one D1 database, one KV namespace, one Worker.
  Defined in `apps/web/wrangler.jsonc` under `env.production`. The top-level bindings are
  local-only (miniflare); local dev + e2e cover pre-prod verification, so there is no
  separate staging environment.
- **Two moving parts per publish:** the Worker (code) and the immutable catalog snapshot
  (data). `bun run deploy:production` ships both.

## One-time bootstrap (do this once)

You need a Cloudflare account on the **Workers Paid** plan ($5/mo covers Workers + D1 +
KV at this scale) and `wrangler` authenticated (`bunx wrangler login`, or an API token —
see below).

1. **Create the resources:**

   ```sh
   cd apps/web
   bunx wrangler d1 create rankedmodel          # → prints database_id
   bunx wrangler kv namespace create CATALOG     # → prints id
   ```

2. **Fill the ids** into `apps/web/wrangler.jsonc` under `env.production`, replacing the
   two `REPLACE_AT_DEPLOY_production_*` placeholders (`d1_databases[0].database_id` and
   `kv_namespaces[0].id`). Commit that change.

3. **Create a scoped API token** (Cloudflare dashboard → My Profile → API Tokens →
   Create Token → Custom): permissions **Account · Workers Scripts · Edit**, **Account ·
   D1 · Edit**, **Account · Workers KV Storage · Edit**. Note your **Account ID** (dash
   sidebar).

4. **First deploy, from your shell** (proves the token + resources before automation owns
   prod):

   ```sh
   export CLOUDFLARE_API_TOKEN=…      # the token from step 3
   export CLOUDFLARE_ACCOUNT_ID=…     # your account id
   bun run deploy:production
   ```

   This runs: migrate remote D1 → `vite build` → `wrangler deploy --env production` →
   publish data (seed remote D1 → snapshot to KV → bump `meta.data_version`).

5. **Smoke-check** the live Worker (see [Post-deploy checks](#post-deploy-checks)).

6. **Hand CD the keys:** in GitHub → repo → Settings → Secrets and variables → Actions,
   add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (same values as step 4). From
   now on every push to `main` deploys automatically.

> Until these secrets exist, the `deploy` job still runs on every push to `main` but
> **no-ops with a notice** (it only skips the deploy — `ci` + `e2e` still gate the push).
> It activates the moment the `CLOUDFLARE_API_TOKEN` secret is present. So the CD wiring
> is safe to merge before the bootstrap is done.

### Optional: approval gate

`.github/workflows/ci.yml`'s `deploy` job targets a GitHub **`production` environment**.
To require a manual click before each production deploy, create that environment (repo →
Settings → Environments → `production`) and add yourself as a **required reviewer**. No
workflow edit needed — the job will pause for approval. Left unconfigured, deploys are
fully automatic.

## Steady state

Once secrets are set, `main` is the deploy trigger. CI (`ci` + `e2e` jobs) gates the
`deploy` job — a red build never ships.

- **Code change** → open a PR → CI + e2e run → merge → CD deploys the Worker and
  republishes data.
- **Data / entity change** → edit files under `data/**` (the repo *is* the CMS; see
  [CONTRIBUTING.md](../CONTRIBUTING.md)) → open a PR. CI runs `validate-data` + the golden
  tests, and the `data/derived/scores.json` diff in the PR *is* the review (it shows
  exactly how rankings move). Merge → CD auto-publishes: the same Worker redeploys and a
  new `catalog:v{N}` snapshot ships. No dashboard, no SQL, no manual step.

To publish a data change **without** going through CD (e.g. a hotfix from your shell):

```sh
export CLOUDFLARE_API_TOKEN=…  CLOUDFLARE_ACCOUNT_ID=…
bun run publish-data:remote     # migrate → validate → derive → seed remote D1 → snapshot KV
```

## Invalidation & rollback (arch §9)

Publishing bumps `meta.data_version`; the new snapshot lands at the immutable
`catalog:v{N}` KV key. Every cache — browser, edge, TanStack Query — is keyed by that
version, so **there is nothing to purge, ever**.

- **Roll back data:** point `data_version` at an older `N` (all versions are retained):

  ```sh
  cd apps/web
  bunx wrangler d1 execute DB --remote --env production \
    --command "UPDATE meta SET value='<N>' WHERE key='data_version'"
  ```

- **Roll back code:** `bunx wrangler rollback --env production` (from `apps/web`), or
  revert the commit and let CD redeploy.

## Post-deploy checks

Things local verification cannot prove — check these after the first deploy:

- **Edge cache** (`s-maxage`/SWR at Cloudflare's CDN): headers are asserted in e2e, but
  real edge semantics only show up post-deploy. `curl -sI https://<host>/api/catalog/v1.json`.
- **D1 read replication:** the Sessions API path (`first-unconstrained`) is a local no-op;
  enable replication on the production database in the Cloudflare dashboard to activate it.
- **Workers Logs / Analytics:** `observability.enabled` is on in `wrangler.jsonc`;
  dashboards populate once traffic flows.

## Phase-4 sketch: ingestion-as-PR automation

Freshness is the #1 competitive deficit; the architecture already supports closing it
without structural change:

1. A **Cron Trigger** Worker (or scheduled GitHub Action) polls upstream sources —
   models.dev (MIT JSON API: specs + pricing), LMArena's published leaderboard dataset
   (Elo), OpenRouter's API (catalog/pricing deltas).
2. It renders the diffs **as curated-file changes** (`data/**` JSON/CSV) and opens a PR.
3. CI runs `validate-data` + golden tests; the admin reviews the diff like any other —
   automation proposes, curation disposes.
4. Merge → the CD pipeline above ships it.

Nothing about the running site changes; the moat stays the reviewed dataset.
