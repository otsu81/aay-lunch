import { Db } from './db'

export class Generator {
  constructor(private db: Db) {}

  async generateWeekdayMenu(weekday: string) {
    const results = await this.db.getWeekdayMenuAllRestaurants(weekday)

    const html = `
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
              Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            padding: 1rem;
            background: #f9f9f9;
            color: #333;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            max-width: 900px;
            margin: auto;
            background: #fff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 6px;
            overflow: hidden;
          }
          td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          tr:last-child td {
            border-bottom: none;
          }
          td:first-child {
            font-weight: 600;
            width: 30%;
            color: #555;
          }
        </style>
      </head>
      <body>
        <table>
          <tbody>
            ${results
              .map(
                (r) =>
                  `<tr><td>${r.name}:</td><td>${r.dish}</td></tr>`
              )
              .join('\n')}
          </tbody>
        </table>
      </body>
    </html>
  `
      return html
  }
}
