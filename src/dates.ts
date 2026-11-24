import { addDays, format, getISOWeek, isWeekend, startOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { type Weekday, weekdays } from "./weekdays"

export function getCurrentWeek(now = new Date()) {
  const stockholmNow = toZonedTime(now, "Europe/Stockholm")
  const monday = startOfWeek(stockholmNow, { weekStartsOn: 1 })

  return {
    from: format(monday, "yyyy-MM-dd"),
    until: format(addDays(monday, 4), "yyyy-MM-dd"),
  }
}

export function getStockholmDate(date = new Date()) {
  return format(toZonedTime(date, "Europe/Stockholm"), "yyyy-MM-dd")
}

export function isStockholmWeekend(date = new Date()) {
  return isWeekend(toZonedTime(date, "Europe/Stockholm"))
}

export function getCurrentISOWeek(now = new Date()) {
  return getISOWeek(toZonedTime(now, "Europe/Stockholm"))
}

export function getCurrentWeekdayDate(weekday: Weekday, now = new Date()) {
  const stockholmNow = toZonedTime(now, "Europe/Stockholm")
  const monday = startOfWeek(stockholmNow, { weekStartsOn: 1 })
  return format(addDays(monday, weekdays.indexOf(weekday)), "yyyy-MM-dd")
}
