import type { Db } from './db'

export class Generator {
  constructor(private db: Db) {}

  async generateWeekdayMenu(weekday: string) {
    const results = await this.db.getWeekdayMenuAllRestaurants(weekday)
    const lastRefresh = await this.db.getLastRefreshTimestamp()

    const days = [
      { label: 'Mon', path: '/mon' },
      { label: 'Tue', path: '/tue' },
      { label: 'Wed', path: '/wed' },
      { label: 'Thu', path: '/thu' },
      { label: 'Fri', path: '/fri' },
    ]

    const weekdayLinks = days
      .map(({ label, path }) => {
        if (label.toLowerCase() === weekday.toLowerCase()) {
          return `<span class="active-day">${label}</span>`
        }
        return `<a href="${path}">${label}</a>`
      })
      .join(' | ')

    const html = `
    <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
              Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background: #f3f6f9;
            color: #333;
            line-height: 1.5;
          }

          /* HEADER */
          header.site-header {
            background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
            color: #fff;
            text-align: center;
            padding: 2rem 1rem;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 1.5rem;
          }
          header.site-header h1 {
            font-size: 2.5rem;
            letter-spacing: 1px;
            font-weight: 600;
          }

          .menu-table {
            width: 100%;
            max-width: 1000px;
            margin: 0 auto 2rem;
            border-collapse: collapse;
            background: #fff;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .menu-table td {
            padding: 0.75rem 1rem;
            vertical-align: top;
            border-bottom: 1px solid #eee;
          }
          .menu-table tr:last-child td {
            border-bottom: none;
          }
          .menu-table tr:nth-child(even) {
            background: #fafbfc;
          }
          .menu-table tr:hover {
            background: #f0f8ff;
          }

          .menu-table td:first-child {
            font-weight: 600;
            width: 30%;
            color: #555;
          }
          .menu-table td:first-child a {
            text-decoration: none;
            color: #4facfe;
          }
          .menu-table td:first-child a:hover {
            text-decoration: underline;
          }

          .active-day {
            font-weight: 700;
            color: #222;
            user-select: none;
            margin: 0 0.5rem;
          }
          .menu-table td a {
            margin: 0 0.5rem;
            text-decoration: none;
            color: #4facfe;
          }
          .menu-table td a:hover {
            text-decoration: underline;
          }

          .refresh-info {
            text-align: center;
            color: #aaa;
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <header class="site-header">
          <h1>Aay Lunch</h1>
          <h5>~ What's for lunch today around Nordenskiöldsgatan, Malmö ~</h5>
        </header>

        <table class="menu-table">
          <tbody>
            <tr>
              <td colspan="2" style="text-align: center; font-weight: 600; padding: 1rem 0;">
                ${weekdayLinks}
              </td>
            </tr>
            ${results
              .map(
                (r) =>
                  `<tr>
                    <td><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a></td>
                    <td>${r.dish}</td>
                  </tr>`,
              )
              .join('\n')}
          </tbody>
        </table>

        <div class="refresh-info">Last refresh: ${lastRefresh}</div>

      </body>
    </html>
    `
    return html
  }
}
