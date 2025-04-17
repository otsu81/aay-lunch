import { Db } from './db'

export class Generator {
  constructor(private db: Db) {}

  async generateWeekdayMenu(weekday: string) {
    const results = await this.db.getWeekdayMenuAllRestaurants(weekday)

    const html = `
      <html>
        <body>
          <table border="0" cellpadding="4" cellspacing="0">
            <tbody>
              ${results.map((r) => `<tr><td>${r.name}: </td><td>${r.dish}</td></tr>`).join('\n')}
            </tbody>
          </table>
        </body>
      </html>
    `
    return html
  }
}
