import { html, raw } from "hono/html"
import { formatDate, formatDateTime } from "./dates"
import type { DayMenu, WeekdayMenuRow } from "./db"
import { type Dish, type RestaurantInfo, type Weekday, weekdays } from "./menu"

// Build markup only with html``, which escapes every interpolated string.
type Fragment = ReturnType<typeof html>

type Entry = { restaurant: RestaurantInfo; row?: WeekdayMenuRow }

// Interleaved, not string-joined: a Fragment can be a Promise, which join() would print as "[object Promise]".
const joinFragments = (fragments: Fragment[], separator: string) =>
  fragments.flatMap((fragment, i) => (i ? [raw(separator), fragment] : [fragment]))

const link = ({ url, name }: RestaurantInfo, title?: string) =>
  html`<a href="${url}" target="_blank" rel="noopener noreferrer"${title ? html` title="${title}"` : ""}>${name}</a>`

const dishItem = ({ label, text }: Dish) => html`<li>${label ? html`<b>${label}</b>: ` : ""}${text}</li>`

function refreshNotice(missing: Entry[], now: Date) {
  const today = formatDate(now)
  const isFailed = ({ row }: Entry) =>
    !!row?.lastAttemptAt && formatDate(new Date(row.lastAttemptAt)) === today && row.lastStatus !== "available"
  // Closed is a deliberate absence, not a scraper problem.
  const notClosed = missing.filter(({ row }) => row?.lastStatus !== "closed")
  const failed = notClosed.filter(isFailed).map(({ restaurant }) => link(restaurant))
  const notFetched = notClosed.filter((e) => !isFailed(e)).map(({ restaurant }) => link(restaurant))

  const lines: Fragment[] = []
  if (failed.length) lines.push(html`failed to fetch: ${joinFragments(failed, ", ")}`)
  if (notFetched.length) lines.push(html`not yet fetched for today: ${joinFragments(notFetched, ", ")}`)
  return lines.length ? html`<p class="refresh-status">${joinFragments(lines, "<br>")}</p>` : ""
}

function tableRow(restaurant: RestaurantInfo, menu: DayMenu) {
  const freshness = `Menu fetched ${formatDateTime(new Date(menu.fetchedAt))}; valid ${menu.validFrom} through ${menu.validUntil}`
  return html`<tr>
        <td class="restaurant">${link(restaurant, freshness)}</td>
        <td><ul>${menu.dishes.map(dishItem)}</ul></td>
      </tr>`
}

export function renderWeekdayMenu(rows: WeekdayMenuRow[], restaurants: RestaurantInfo[], weekday: Weekday, now: Date) {
  const rowsById = new Map(rows.map((row) => [row.id, row]))
  const entries: Entry[] = restaurants.map((restaurant) => ({ restaurant, row: rowsById.get(restaurant.id) }))
  const tableRows = entries.flatMap(({ restaurant, row }) => (row?.menu ? [tableRow(restaurant, row.menu)] : []))
  const missing = entries.filter(({ row }) => !row?.menu)

  const weekdayNav = weekdays.map((day) => {
    const label = day[0].toUpperCase() + day.slice(1)
    const cls = day === weekday ? "pill active" : "pill"
    return html`<a href="/${day}" class="${cls}">${label}</a>`
  })

  return page(weekdayNav, tableRows, refreshNotice(missing, now))
}

// Inserted with raw(): browsers don't decode entities inside <style>, so escaping would break the CSS.
const styles = `
    :root {
      --bg: #f5f5f7;
      --table-bg: #fff;
      --row-alt: #fafafa;
      --text: #1d1d1f;
      --text-muted: #86868b;
      --accent: #0071e3;
      --border: #d2d2d7;
      --shadow: rgba(0,0,0,0.08);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1d1d1f;
        --table-bg: #2d2d2f;
        --row-alt: #262628;
        --text: #f5f5f7;
        --text-muted: #86868b;
        --accent: #2997ff;
        --border: #424245;
        --shadow: rgba(0,0,0,0.3);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      background: var(--bg);
      color: var(--text);
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    header { margin-bottom: 1.5rem; }
    header h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; }
    header p { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem; }
    nav { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .pill {
      display: inline-block;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid var(--border);
      color: var(--text);
      background: var(--table-bg);
      transition: all 0.15s ease;
    }
    .pill:hover { border-color: var(--accent); color: var(--accent); }
    .pill.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--table-bg);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px var(--shadow);
    }
    tr:nth-child(even) { background: var(--row-alt); }
    td {
      padding: 1rem;
      vertical-align: top;
      border-bottom: 1px solid var(--border);
    }
    tr:last-child td { border-bottom: none; }
    .restaurant {
      width: 180px;
      font-weight: 600;
      white-space: nowrap;
    }
    .restaurant a {
      color: var(--accent);
      text-decoration: none;
    }
    .restaurant a:hover { text-decoration: underline; }
    ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    li {
      padding-left: 1rem;
      position: relative;
      font-size: 0.9rem;
    }
    li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--text-muted);
    }
    footer {
      margin-top: 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .refresh-status {
      font-size: 0.7rem;
      opacity: 0.5;
      margin-bottom: 1rem;
    }
    .refresh-status a { color: inherit; text-decoration: none; }
    .github {
      display: inline-block;
      margin-top: 0.5rem;
      color: var(--text-muted);
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .github:hover { opacity: 1; }
    @media (max-width: 600px) {
      .restaurant { width: auto; white-space: normal; }
      td { display: block; padding: 0.75rem 1rem; }
      td:first-child { padding-bottom: 0.25rem; border-bottom: none; }
    }
`

const page = (nav: Fragment[], tableRows: Fragment[], refreshNotice: Fragment | "") => html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Mec Lunch</title>
  <style>${raw(styles)}  </style>
</head>
<body>
  <header>
    <h1>Mec Lunch</h1>
    <p>What's for lunch around Media Evolution City, Malmö</p>
    <nav>${nav}</nav>
  </header>

  <main>
    <table>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </main>

  <footer>
    ${refreshNotice}
    <a href="https://github.com/otsu81/aay-lunch" target="_blank" rel="noopener noreferrer" class="github">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    </a>
  </footer>
</body>
</html>`
