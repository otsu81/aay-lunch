import type { Db } from "./db"

export class Generator {
  constructor(private db: Db) {}

  private parseMenuItems(dish: string): string[] {
    return dish
      .split(/<br\s*\/?>/)
      .map((item) => item.trim())
      .filter((item) => item && item !== "undefined")
  }

  async generateWeekdayMenu(weekday: string) {
    const results = await this.db.getWeekdayMenuAllRestaurants(weekday)
    const lastRefresh = await this.db.getLastRefreshTimestamp()

    const days = [
      { label: "Mon", path: "/mon" },
      { label: "Tue", path: "/tue" },
      { label: "Wed", path: "/wed" },
      { label: "Thu", path: "/thu" },
      { label: "Fri", path: "/fri" },
    ]

    const weekdayNav = days
      .map(({ label, path }) => {
        const isActive = label.toLowerCase() === weekday.toLowerCase()
        const cls = isActive ? "pill active" : "pill"
        return `<a href="${path}" class="${cls}">${label}</a>`
      })
      .join("")

    const rows = results
      .map((r) => {
        const items = this.parseMenuItems(r.dish)
        const listItems = items.map((item) => `<li>${item}</li>`).join("")
        return `<tr>
        <td class="restaurant"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a></td>
        <td><ul>${listItems}</ul></td>
      </tr>`
      })
      .join("\n")

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Aay Lunch</title>
  <style>
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
    @media (max-width: 600px) {
      .restaurant { width: auto; white-space: normal; }
      td { display: block; padding: 0.75rem 1rem; }
      td:first-child { padding-bottom: 0.25rem; border-bottom: none; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Aay Lunch</h1>
    <p>What's for lunch around Nordenskiöldsgatan, Malmö</p>
    <nav>${weekdayNav}</nav>
  </header>

  <main>
    <table>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </main>

  <footer>Last refresh: ${lastRefresh}</footer>
</body>
</html>`
    return html
  }
}
