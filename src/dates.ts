import { addDays, format, getISODay, getISOWeek, startOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { nthWeekday, type Weekday, weekdays } from "./menu"

const timeZone = "Europe/Stockholm"

const zoned = (date: Date) => toZonedTime(date, timeZone)
const dateString = (date: Date) => format(date, "yyyy-MM-dd")
const monday = (now: Date) => startOfWeek(zoned(now), { weekStartsOn: 1 })

export function formatDate(date: Date) {
  return dateString(zoned(date))
}

export function getWeekday(now: Date) {
  return nthWeekday(getISODay(zoned(now)))
}

export function getWeekdayDate(weekday: Weekday, now: Date) {
  return dateString(addDays(monday(now), weekdays.indexOf(weekday)))
}

export function getWeekNumber(now: Date) {
  return getISOWeek(zoned(now))
}

export function getWeekRange(now: Date) {
  return { from: getWeekdayDate("mon", now), until: getWeekdayDate("fri", now) }
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short", timeZone }).format(date)
}
