import { addDays, format, getISOWeek, startOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const weekdayOffsets: Record<string, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
}

export function getCurrentWeek(now = new Date()) {
  const stockholmNow = toZonedTime(now, "Europe/Stockholm")
  const monday = startOfWeek(stockholmNow, { weekStartsOn: 1 })

  return {
    from: format(monday, "yyyy-MM-dd"),
    until: format(addDays(monday, 4), "yyyy-MM-dd"),
  }
}

export function getCurrentISOWeek(now = new Date()) {
  return getISOWeek(toZonedTime(now, "Europe/Stockholm"))
}

// Menus are often published/edited over the weekend before the week starts, so the
// freshness window opens the preceding Friday and closes on the current Friday. Used to
// decide which per-item "modified" timestamps count as belonging to the current week.
export function getMenuFreshnessWindow(now = new Date()) {
  const stockholmNow = toZonedTime(now, "Europe/Stockholm")
  const monday = startOfWeek(stockholmNow, { weekStartsOn: 1 })

  return {
    from: format(addDays(monday, -3), "yyyy-MM-dd"),
    until: format(addDays(monday, 4), "yyyy-MM-dd"),
  }
}

export function getCurrentWeekdayDate(weekday: string, now = new Date()) {
  const offset = weekdayOffsets[weekday]
  if (offset === undefined) throw new Error(`invalid weekday: ${weekday}`)

  const stockholmNow = toZonedTime(now, "Europe/Stockholm")
  const monday = startOfWeek(stockholmNow, { weekStartsOn: 1 })
  return format(addDays(monday, offset), "yyyy-MM-dd")
}
