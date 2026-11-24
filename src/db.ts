import { getWeekdayDate } from "./dates"
import type { RefreshStatus } from "./restaurants/scraper"
import { type Dish, isWeekday, type Menu, type Weekday, weekdays } from "./weekdays"

export interface DayMenu {
  dishes: Dish[]
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

// A day column holds its dishes as JSON, or NULL when the day has none.
type DayColumn = string | null

function serializeDishes(dishes: Dish[] | undefined): DayColumn {
  return dishes?.length ? JSON.stringify(dishes) : null
}

function parseDishes(column: string): Dish[] {
  return JSON.parse(column)
}

// Compares stored forms so equality means "storing either writes the same row".
export function isSameMenu(a: Menu, b: Menu) {
  return weekdays.every((day) => serializeDishes(a[day]) === serializeDishes(b[day]))
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
  const columns = [...weekdays, "valid_from", "valid_until", "fetched_at"]
  await db
    .prepare(
      `
      INSERT INTO menus (restaurant_id, ${columns.join(", ")})
      VALUES (?, ${columns.map(() => "?").join(", ")})
      ON CONFLICT(restaurant_id) DO UPDATE SET
        ${columns.map((column) => `${column}=excluded.${column}`).join(", ")};
      `,
    )
    .bind(
      restaurantId,
      ...weekdays.map((day) => serializeDishes(menu[day])),
      validFrom,
      validUntil,
      fetchedAt.toISOString(),
    )
    .run()
}

export async function getMenu(
  db: D1Database,
  restaurantId: number,
): Promise<{ menu: Menu; validUntil: string } | null> {
  const row = await db
    .prepare(`SELECT ${weekdays.join(", ")}, valid_until AS validUntil FROM menus WHERE restaurant_id = ?`)
    .bind(restaurantId)
    .first<Record<Weekday, DayColumn> & { validUntil: string }>()
  if (!row) return null

  const menu: Menu = {}
  for (const day of weekdays) {
    const column = row[day]
    if (column) menu[day] = parseDishes(column)
  }
  return { menu, validUntil: row.validUntil }
}

export async function getWeekdayMenus(db: D1Database, weekday: Weekday, now = new Date()): Promise<WeekdayMenuRow[]> {
  if (!isWeekday(weekday)) throw new Error(`invalid weekday: ${weekday}`)

  const date = getWeekdayDate(weekday, now)

  // Column identifiers can't be parameterized in SQLite; weekday is validated above
  const { results } = await db
    .prepare(
      `
      SELECT r.id, m.${weekday} AS dishes, m.fetched_at AS fetchedAt,
        m.valid_from AS validFrom, m.valid_until AS validUntil,
        r.last_attempt_at AS lastAttemptAt, r.last_status AS lastStatus
      FROM restaurants r
      LEFT JOIN menus m ON r.id = m.restaurant_id AND m.valid_from <= ? AND m.valid_until >= ?
      `,
    )
    .bind(date, date)
    .all<Omit<WeekdayMenuRow, "menu"> & Omit<DayMenu, "dishes"> & { dishes: DayColumn }>()

  // upsertMenu writes the menu columns together, so dishes imply the rest are set.
  return results.map(({ dishes, fetchedAt, validFrom, validUntil, ...attempt }) => ({
    ...attempt,
    menu: dishes ? { dishes: parseDishes(dishes), fetchedAt, validFrom, validUntil } : null,
  }))
}
