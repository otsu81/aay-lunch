import { getCurrentWeek, getCurrentWeekdayDate } from "./dates"
import type { Restaurant } from "./restaurants/restaurant"

export interface WeekdayMenuRow {
  name: string
  url: string
  dish: string
  fetchedAt: string
}

export class Db {
  constructor(private db: D1Database) {}

  async refreshMenu(restaurant: Restaurant, now = new Date()) {
    let menu: Record<string, string> | undefined
    try {
      menu = await restaurant.generateMenu()
      if (!menu) {
        throw new Error(`unable to generate menu for ${restaurant.restaurantName}`)
      }
    } catch (error) {
      // A missing menu is safer than retaining data from an earlier scrape.
      await this.db.prepare("DELETE FROM menus WHERE restaurant_id = ?").bind(restaurant.id).run()
      throw error
    }

    const validity = getCurrentWeek(now)
    await this.db.batch([
      this.db
        .prepare(
          `
        INSERT INTO restaurants(id, name, url, menu_type)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name=excluded.name,
          url=excluded.url,
          menu_type=excluded.menu_type;
        `,
        )
        .bind(restaurant.id, restaurant.restaurantName, restaurant.url, restaurant.menuType),
      this.db
        .prepare(
          `
        INSERT INTO menus (restaurant_id, mon, tue, wed, thu, fri, valid_from, valid_until, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(restaurant_id) DO UPDATE SET
          mon=excluded.mon,
          tue=excluded.tue,
          wed=excluded.wed,
          thu=excluded.thu,
          fri=excluded.fri,
          valid_from=excluded.valid_from,
          valid_until=excluded.valid_until,
          fetched_at=excluded.fetched_at;
        `,
        )
        .bind(
          restaurant.id, // allow for weekday menus that aren't complete
          menu.mon || null,
          menu.tue || null,
          menu.wed || null,
          menu.thu || null,
          menu.fri || null,
          validity.from,
          validity.until,
          now.toISOString(),
        ),
    ])

    console.log(`restaurant "${restaurant.restaurantName}" menu refreshed`)
    return menu
  }

  async getWeekdayMenuAllRestaurants(weekday: string, now = new Date()): Promise<WeekdayMenuRow[]> {
    const validDays = new Set(["mon", "tue", "wed", "thu", "fri"])
    if (!validDays.has(weekday)) {
      throw new Error(`invalid weekday: ${weekday}`)
    }

    const date = getCurrentWeekdayDate(weekday, now)

    // Column identifiers can't be parameterized in SQLite; weekday is validated above
    const { results } = await this.db
      .prepare(
        `
        SELECT r.name, r.url, m.${weekday} AS dish, m.fetched_at AS fetchedAt
        FROM restaurants r
        JOIN menus m ON r.id = m.restaurant_id
        WHERE m.${weekday} IS NOT NULL AND m.${weekday} != ''
          AND m.valid_from <= ? AND m.valid_until >= ?
        `,
      )
      .bind(date, date)
      .all<WeekdayMenuRow>()

    return results
  }

  async setLastRefreshTimestamp() {
    await this.db
      .prepare(
        `
        INSERT INTO metadata (key, value, updated_at)
        VALUES ('last_refresh', datetime('now'), datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = datetime('now'),
          updated_at = datetime('now')
      `,
      )
      .run()
  }

  async getLastRefreshTimestamp(): Promise<string | null> {
    const res = await this.db
      .prepare(
        `
        SELECT value FROM metadata WHERE key = 'last_refresh'
      `,
      )
      .first<{ value: string }>()

    return res?.value || null
  }
}
