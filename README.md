# Mec Lunch

A scraper for lunch places near my office. Refresh the database and fetch the latest with `/refresh`.

Is a restaurant missing? Make a PR!

## Dev

Uses bun. `bun run dev` applies D1 migrations locally and starts wrangler. `bun run deploy` applies D1 migrations to prod, then deploys to prod.

## Adding a restaurant

1. Create `src/restaurants/<name>.ts` exporting an `HtmlRestaurant` `{ id, name, url, parse }`. Copy a neighbor such as `kolgas.ts`. `parse(doc)` returns the week's `Menu`; `scrape()` in `scraper.ts` handles fetching, closures and week validity.
2. Use the next unused `id`. Menus are stored in D1 by id, so never reuse or change one.
3. Add it to `src/restaurants/all.ts`. List order is display order.
4. Save the raw page under `src/tests/fixtures/` and add it to the `fixtures` map in `src/tests/restaurants.test.ts`, keyed by `<Restaurant>.url`.
5. Run `bun run test -- -u` once to record the snapshot, and review it. Fixtures run at the test's fixed date, so a page naming another week snapshots as unavailable.

Not HTML? Implement `CustomRestaurant` with its own `generateMenu(now)` instead (see `spill.ts`).
