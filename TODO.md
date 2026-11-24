# TODO

Goal: code an agent can navigate and copy safely. One way to do each thing, shallow call paths, types that catch mistakes.

Invariant for every refactor task: `bun run lint` and `bun run test` pass, and the restaurant fixture snapshots (T0) stay byte-identical. Only T4 may change them, deliberately.

## Phase 1: safety net

### T0. Per-restaurant fixture tests

- Save one real HTML/JSON response per restaurant under `src/restaurants/fixtures/`.
- One test file runs every restaurant in `all.ts` against its fixture with a mocked `fetch` and a fixed `now` matching the fixture's week. Snapshot the `MenuResult`.
- This is the regression net for Phase 2 and the pattern to copy when adding a restaurant.

### T8. Test feedback loop

- `tsconfig.json` excludes `*.test.ts` and `test-setup.ts`, so `bun run lint` never typechecks tests. Include them, fix what breaks.
- Add a test that restaurant ids in `all.ts` are unique.
- Drop the `test:file` script; it is identical to `test`.

## Phase 2: refactors (sequential, same files)

### T1. One weekday vocabulary

Defined 9 times today: `index.ts:8`, `db.ts:14`, `dates.ts:4`, `generator.ts:48`, `scraper.ts:19`, `varv.ts:5`, `miamaria.ts:5`, `spill.ts:14`, `valfarden.ts:26`.

- One module exports `weekdays = ["mon", "tue", "wed", "thu", "fri"] as const`, `type Weekday`, and `Menu = Partial<Record<Weekday, string>>`.
- Index lookups become `weekdays[n - 1]`. `swedishWeekday` also maps English names (Varv). Delete every local mapping.
- Scrapers use `Menu`, not `Record<string, string>`.

### T7. Stockholm time in one place

- `"Europe/Stockholm"` appears 6 times. `index.ts:12` `getWeekday()` duplicates `dates.ts` and string-checks `"sat"`/`"sun"` despite `isStockholmWeekend`. `getCurrentWeek` and `getCurrentWeekdayDate` both compute Monday.
- All date logic in `dates.ts` behind one zoned-time helper. Consistent names.

### T3. One DOM idiom, one text cleaner, one fetch

- linkedom `NodeList extends Array`, so `Array.from(...)` is noise. Three cast styles exist. Add `queryAll(root, selector): HTMLElement[]` to `scraper.ts`.
- Whitespace cleanup exists as `clean` (p2), `cleanText` (varv), inline (cafelive, clemens), bare `.trim()` elsewhere. One `text(el)` helper.
- `fetchRestaurant` sends the browser headers for every restaurant; drop Varv's custom headers and the `init` threading.

### T2. One scrape pipeline

- 9 HTML scrapers repeat `fetchDocument` → `pageIndicatesClosure` → `closed()` → parse → `menuForCurrentWeek(menu, pageText, now)`.
- A restaurant becomes a plain object `{ id, name, url, parse(doc): Menu }`. A single function in `scraper.ts` owns fetch, closure check, and week validity. Spill keeps a custom `generateMenu`.
- Drop per-site "X not found" reasons: an empty menu already yields `unavailable("no weekday menu parsed")`.
- Rename `restaurantName` → `name` (matches the DB column).

### T6. Pure renderer

- `Generator` is a class depending on `Db` for one query; its test fakes it with `as unknown as Db`.
- Make it a pure `renderWeekdayMenu(rows, restaurants, weekday, now)`. `index.ts` fetches rows.
- Move the CSS out of the method to a module constant. Remove the duplicated link markup (`generator.ts:7` vs `:76`). Fix the `?? ""` typing workarounds.

### T5. Refresh logic out of Db

- `Db.refreshMenu` runs scraping and the stale-menu guard; `index.ts:21` holds the other half. Move all orchestration to `src/refresh.ts`. `Db` keeps plain queries.
- `restaurants.name`/`url` are written every refresh and never read; code is the source of truth. Drop them with a migration.
- `/refresh` handler uses `c.json`.

### T4. Structured dishes, escaped output

- Dishes are HTML strings: scrapers join with `"<br>"`, Niagara/P2 inject `<b>`, Niagara copies third-party `innerHTML`, the generator splits on `<br>` and renders unescaped. Välfärden stores a fake `"Stängt"` dish.
- `Menu = Partial<Record<Weekday, Dish[]>>`, stored as JSON in the existing day columns. Migration clears `menus` (next refresh repopulates).
- Render with `hono/html` so output is escaped by default.
- Update fixture snapshots deliberately.

## Not doing

- Renaming the worker in `wrangler.jsonc`: creates a new prod worker.
- Auth on `/refresh`: already handled outside the repo. Cloudflare Access (email OTP) fronts the whole `lunch.otsu.dev` domain.
