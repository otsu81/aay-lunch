# Mec Lunch

A scraper for lunch places near my office. Refresh the database and fetch the latest with `/refresh`.

Is a restaurant missing? Make a PR!

## Dev

Uses bun. `bun run dev` applies D1 migrations locally and starts wrangler. `bun run deploy` applies D1 migrations to prod, then deploys to prod.
