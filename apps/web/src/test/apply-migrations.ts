import { applyD1Migrations, env } from 'cloudflare:test'

// Runs once per isolated-storage context: bring the test D1 up to the current schema.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
