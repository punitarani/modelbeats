# Deployment & DB pipeline — design

**Date:** 2026-07-18
**Status:** approved, implemented
**Scope:** push readiness · Cloudflare production deploy · D1 setup · migration pipeline ·
easy entity updates · full CI/CD.

## Context

The app (Cloudflare Worker + TanStack Start SSR, D1 source-of-truth, versioned KV catalog
snapshots) was built end-to-end and verifies fully locally via miniflare. `bun run ci`
(typecheck → lint → test → build → budgets) and `bun run e2e` are green; the working tree
was clean. The gaps were all in the **delivery seams**, not the application code.

### Findings at review

| # | Finding | Bucket |
|---|---|---|
| 1 | GitHub remote is empty — `git ls-remote origin` returns 0 refs; commits were laptop-only | Push |
| 2 | No CD workflow — CI was test-only; nothing deployed or published | E2E pipeline |
| 3 | Migration journal drift — `0002_ranked_flag.sql` was hand-written, bypassing `drizzle-kit generate`; the journal + `meta/` snapshots stopped at `0001`. Runtime fine (wrangler reads the dir); the **authoring** tool would re-emit `ranked` as a duplicate on the next `generate` | Migration pipeline |
| 4 | `publish-data` never applied migrations — the README quickstart would fail on a fresh clone (seed upserts into tables that don't exist yet) | DB setup / entity updates |
| 5 | `wrangler.jsonc` carried `REPLACE_AT_DEPLOY_*` placeholder ids + an unused staging env | Cloudflare deploy |

## Decisions

Resolved with the user before implementing:

1. **Deploy automation:** GitHub Actions CD (merge to `main` → deploy), over Cloudflare
   Workers Builds or manual-only. Keeps deploy logic in-repo, reviewable, and gateable.
2. **Environments:** **production only** — one D1 + one KV + one Worker. Local miniflare
   covers pre-prod; a solo project doesn't need a staging tier. Staging was descoped from
   `wrangler.jsonc`, `deploy.ts`, `package.json`, and the docs.
3. **Data updates:** **auto-publish on merge** — merging a `data/**` PR runs the publish
   pipeline to production. "Very easily update an entity" == merge a file.
4. **Push:** push `main` after plan approval (remote is empty; only `main` is pushed, the
   local `round5-ranks200plus` branch stays local).

## Design

### A. In-repo changes (implemented here)

1. **Migration drift fix (finding 3).** Deleted the hand-written `0002_ranked_flag.sql`
   and regenerated it through `drizzle-kit generate --name ranked_flag`. Because nothing
   is deployed yet, migration history is still safe to rewrite. Result: `_journal.json`
   has all three entries, `meta/0002_snapshot.json` exists, the SQL is byte-identical
   (bar a trailing newline), and `drizzle-kit generate` now reports "No schema changes."
   The filename is unchanged, so local `d1_migrations` state stays consistent.

2. **Migration-drift CI guard (finding 3, prevention).** New step in the `ci` job runs
   `drizzle-kit generate` and fails if `git status --porcelain migrations` is non-empty —
   i.e. schema.ts changed without a committed migration. This catches the exact class of
   drift that finding 3 was, which the existing `drift.test.ts` (Zod↔Drizzle column
   parity) structurally cannot see.

3. **`publish-data` self-applies migrations (finding 4).** `publish-data.ts` now runs
   `wrangler d1 migrations apply DB <target>` (env-threaded for `--remote`) as step 3,
   before seed. Idempotent — wrangler skips already-applied migrations, so the redundant
   call from `deploy.ts` (which migrates first for code-vs-schema ordering) is a no-op.
   Closes the fresh-clone gap and makes data-only CD publishes schema-safe. README
   quickstart updated (no separate migrate step needed).

4. **Production-only topology (decision 2, finding 5).** Removed `env.staging` from
   `wrangler.jsonc`; `deploy.ts` accepts only `production`; dropped `deploy:staging` from
   `package.json`. `ARCHITECTURE.md §5/§10/§11` and `README.md` updated to match.

5. **CD workflow (decisions 1 + 3).** `.github/workflows/ci.yml` renamed CI → CI/CD and
   gains a `deploy` job: `needs: [ci, e2e]`, `if` push-to-main, `environment: production`,
   `concurrency: deploy-production`, running `bun run deploy:production` with
   `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets. **One job covers both code and
   data merges** — a data-only merge redeploys the same Worker and ships a new snapshot.

6. **Docs.** `docs/DEPLOY.md` rewritten as a production-only + CD runbook (bootstrap,
   secrets, first manual deploy, steady state, rollback, post-deploy checks).

### B. One-time Cloudflare bootstrap (owner-run; needs credentials)

Documented in `docs/DEPLOY.md`. Essence: `wrangler d1 create modelbeats` +
`wrangler kv namespace create CATALOG` → paste ids into `env.production` → create a scoped
API token → `bun run deploy:production` once from the shell → add the token + account id
as GitHub Actions secrets. First deploy is manual on purpose, to prove the token and
resources before automation owns production.

### C. Steady state

- **Code change** → PR → CI + e2e → merge → CD deploys + republishes.
- **Entity change** → edit `data/**` → PR (the `scores.json` diff *is* the review) → merge
  → CD auto-publishes to production D1 + KV. Rollback = re-point `data_version` (data) or
  `wrangler rollback` (code).

## Ordering invariants (why two migrate calls coexist)

- **Migrate before seed:** `seed` upserts into tables migrations must have created.
  `publish-data` enforces this for the standalone/local/data-only path.
- **Migrate before *deploy*:** if a release adds a column the new Worker reads, the
  migration must land before `wrangler deploy`. `deploy.ts` enforces this (migrate is its
  step 1). The two calls are idempotent together.

## Risk accepted

Production-only + auto-publish-on-merge means a merge to `main` ships to production with no
staging buffer. Mitigations: `ci` + `e2e` must pass before the `deploy` job runs;
`validate-data` blocks bad data; version-bump rollback is instant. The `production`
GitHub environment allows a one-click required-reviewer gate later with no code change.

## Out of scope (deliberate)

- Executing the Cloudflare bootstrap (needs the owner's credentials).
- Phase-4 ingestion-as-PR automation (sketched in `docs/DEPLOY.md`).
- Any application/UI change — the app was already deploy-ready.
