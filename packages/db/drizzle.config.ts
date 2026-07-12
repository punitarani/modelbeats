import { defineConfig } from 'drizzle-kit'

// Generate-only config: `drizzle-kit generate` diffs the schema offline and emits SQL
// migrations that `wrangler d1 migrations apply` consumes (wrangler.jsonc migrations_dir
// points here). No d1-http credentials needed — we never push/pull/studio against remote.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema.ts',
  out: './migrations',
})
