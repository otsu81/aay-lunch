import { getCurrentWeekdayDate } from "./dates"
import type { Menu, MenuResult, Restaurant } from "./restaurants/restaurant"

export interface WeekdayMenuRow {
  name: string
  url: string
  dish: string
  fetchedAt: string
  validFrom: string
  validUntil: string
}

export class Db {
  constructor(private db: D1Database) {}

  async refreshMenu(restaurant: Restaurant, now = new Date()) {
    let result: MenuResult
    try {
      result = await restaurant.generateMenu(now)
      if (result.status !== "available") {
        await this.deleteMenu(restaurant.id)
        return result
      }
    } catch (error) {
      // A missing menu is safer than retaining data from an earlier scrape.
      await this.deleteMenu(restaurant.id)
      throw error
    }

    const { menu } = result
    if (!result.periodConfirmed && (await this.isUnchangedFromPreviousWeek(restaurant.id, menu, result.validFrom))) {
      await this.deleteMenu(restaurant.id)
      return { status: "unavailable", reason: "unconfirmed menu is unchanged from the previous week" }
    }

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
          result.validFrom,
          result.validUntil,
          now.toISOString(),
        ),
    ])

    console.log(`restaurant "${restaurant.restaurantName}" menu refreshed`)
    return result
  }

  private async deleteMenu(restaurantId: number) {
    await this.db.prepare("DELETE FROM menus WHERE restaurant_id = ?").bind(restaurantId).run()
  }

  private async isUnchangedFromPreviousWeek(restaurantId: number, menu: Menu, validFrom: string) {
    const previous = await this.db
      .prepare("SELECT mon, tue, wed, thu, fri, valid_until FROM menus WHERE restaurant_id = ?")
      .bind(restaurantId)
      .first<Menu & { valid_until: string }>()
    if (!previous || previous.valid_until >= validFrom) return false

    return ["mon", "tue", "wed", "thu", "fri"].every((day) => (previous[day] || "") === (menu[day] || ""))
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
        SELECT r.name, r.url, m.${weekday} AS dish, m.fetched_at AS fetchedAt,
          m.valid_from AS validFrom, m.valid_until AS validUntil
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
}
