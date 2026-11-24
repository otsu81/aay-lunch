import { getWeekdayDate } from "./dates"
import type { MenuResult, RefreshStatus, Restaurant } from "./restaurants/restaurant"
import { isWeekday, type Menu, type Weekday, weekdays } from "./weekdays"

export interface WeekdayMenuRow {
  id: number
  dish: string | null
  fetchedAt: string | null
  validFrom: string | null
  validUntil: string | null
  lastAttemptAt: string | null
  lastStatus: RefreshStatus | null
}

export class Db {
  constructor(private db: D1Database) {}

  async refreshMenu(restaurant: Restaurant, now = new Date()): Promise<MenuResult> {
    await this.db
      .prepare(
        "INSERT INTO restaurants(id, name, url) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET name=excluded.name, url=excluded.url",
      )
      .bind(restaurant.id, restaurant.restaurantName, restaurant.url)
      .run()

    let result: MenuResult
    try {
      result = await this.storeMenu(restaurant, now)
    } catch (error) {
      await this.recordAttempt(restaurant.id, now, "failed")
      throw error
    }
    await this.recordAttempt(restaurant.id, now, result.status)
    return result
  }

  private async recordAttempt(restaurantId: number, now: Date, status: RefreshStatus) {
    await this.db
      .prepare("UPDATE restaurants SET last_attempt_at = ?, last_status = ? WHERE id = ?")
      .bind(now.toISOString(), status, restaurantId)
      .run()
  }

  private async storeMenu(restaurant: Restaurant, now: Date): Promise<MenuResult> {
    // Throws and non-closed misses leave the stored menu untouched, so a transient failure
    // can't blank a still-valid menu. The validity window hides it once its week passes.
    const result = await restaurant.generateMenu(now)

    if (result.status === "closed") {
      await this.db.prepare("DELETE FROM menus WHERE restaurant_id = ?").bind(restaurant.id).run()
      return result
    }
    if (result.status !== "available") return result

    const { menu } = result
    // The stale row stays as the comparison baseline; deleting it would let the same stale
    // scrape be accepted with fresh validity on the next refresh.
    if (!result.periodConfirmed && (await this.isUnchangedFromPreviousWeek(restaurant.id, menu, result.validFrom))) {
      return { status: "unavailable", reason: "unconfirmed menu is unchanged from the previous week" }
    }

    await this.db
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
        restaurant.id,
        menu.mon || null,
        menu.tue || null,
        menu.wed || null,
        menu.thu || null,
        menu.fri || null,
        result.validFrom,
        result.validUntil,
        now.toISOString(),
      )
      .run()

    console.log(`restaurant "${restaurant.restaurantName}" menu refreshed`)
    return result
  }

  private async isUnchangedFromPreviousWeek(restaurantId: number, menu: Menu, validFrom: string) {
    const previous = await this.db
      .prepare("SELECT mon, tue, wed, thu, fri, valid_until FROM menus WHERE restaurant_id = ?")
      .bind(restaurantId)
      .first<Menu & { valid_until: string }>()
    if (!previous || previous.valid_until >= validFrom) return false

    return weekdays.every((day) => (previous[day] || "") === (menu[day] || ""))
  }

  async getWeekdayMenus(weekday: Weekday, now = new Date()): Promise<WeekdayMenuRow[]> {
    if (!isWeekday(weekday)) throw new Error(`invalid weekday: ${weekday}`)

    const date = getWeekdayDate(weekday, now)

    // Column identifiers can't be parameterized in SQLite; weekday is validated above
    const { results } = await this.db
      .prepare(
        `
        SELECT r.id, NULLIF(m.${weekday}, '') AS dish, m.fetched_at AS fetchedAt,
          m.valid_from AS validFrom, m.valid_until AS validUntil,
          r.last_attempt_at AS lastAttemptAt, r.last_status AS lastStatus
        FROM restaurants r
        LEFT JOIN menus m ON r.id = m.restaurant_id AND m.valid_from <= ? AND m.valid_until >= ?
        `,
      )
      .bind(date, date)
      .all<WeekdayMenuRow>()

    return results
  }
}
