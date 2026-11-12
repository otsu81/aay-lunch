import { applyD1Migrations, type D1Migration } from "cloudflare:test"
import { env } from "cloudflare:workers"

await applyD1Migrations(env.db, (env as Env & { TEST_MIGRATIONS: D1Migration[] }).TEST_MIGRATIONS)
