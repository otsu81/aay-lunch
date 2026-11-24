import { getWeekdayDate } from "./dates"
import type { RefreshStatus } from "./restaurants/scraper"
import { isWeekday, type Menu, type Weekday } from "./weekdays"

export interface DayMenu {
  dish: string
  fetchedAt: string
  validFrom: string
  validUntil: string
}

export interface WeekdayMenuRow {
  id: number
  menu: DayMenu | null
  lastAttemptAt: string | null
  lastStatus: RefreshStatus | null
}

export async function recordAttempt(db: D1Database, restaurantId: number, status: RefreshStatus, attemptedAt: Date) {
  await db
    .prepare(
      "INSERT INTO restaurants (id, last_attempt_at, last_status) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET last_attempt_at=excluded.last_attempt_at, last_status=excluded.last_status",
    )
    .bind(restaurantId, attemptedAt.toISOString(), status)
    .run()
}

export async function deleteMenu(db: D1Database, restaurantId: number) {
  await db.prepare("DELETE FROM menus WHERE restaurant_id = ?").bind(restaurantId).run()
}

export async function upsertMenu(
  db: D1Database,
  restaurantId: number,
  { menu, validFrom, validUntil }: { menu: Menu; validFrom: string; validUntil: string },
  fetchedAt: Date,
) {
  await db
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
      restaurantId,
      menu.mon || null,
      menu.tue || null,
      menu.wed || null,
      menu.thu || null,
      menu.fri || null,
      validFrom,
      validUntil,
      fetchedAt.toISOString(),
    )
    .run()
}

export async function getMenu(db: D1Database, restaurantId: number) {
  return db
    .prepare("SELECT mon, tue, wed, thu, fri, valid_until AS validUntil FROM menus WHERE restaurant_id = ?")
    .bind(restaurantId)
    .first<Menu & { validUntil: string }>()
}

export async function getWeekdayMenus(db: D1Database, weekday: Weekday, now = new Date()): Promise<WeekdayMenuRow[]> {
  if (!isWeekday(weekday)) throw new Error(`invalid weekday: ${weekday}`)

  const date = getWeekdayDate(weekday, now)

  // Column identifiers can't be parameterized in SQLite; weekday is validated above
  const { results } = await db
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
    .all<Omit<WeekdayMenuRow, "menu"> & Omit<DayMenu, "dish"> & { dish: string | null }>()

  // upsertMenu writes the menu columns together, so a dish implies the rest are set.
  return results.map(({ dish, fetchedAt, validFrom, validUntil, ...attempt }) => ({
    ...attempt,
    menu: dish ? { dish, fetchedAt, validFrom, validUntil } : null,
  }))
}
