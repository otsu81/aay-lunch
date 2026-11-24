import { addDays, format, getISODay, getISOWeek, startOfWeek } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { type Weekday, weekdays } from "./weekdays"

const timeZone = "Europe/Stockholm"

const zoned = (date: Date) => toZonedTime(date, timeZone)
const dateString = (date: Date) => format(date, "yyyy-MM-dd")
const monday = (now: Date) => startOfWeek(zoned(now), { weekStartsOn: 1 })

export function formatDate(date = new Date()) {
  return dateString(zoned(date))
}

export function getWeekday(now = new Date()): Weekday | undefined {
  return weekdays[getISODay(zoned(now)) - 1]
}

export function getWeekdayDate(weekday: Weekday, now = new Date()) {
  return dateString(addDays(monday(now), weekdays.indexOf(weekday)))
}

export function getWeekNumber(now = new Date()) {
  return getISOWeek(zoned(now))
}

export function getWeekRange(now = new Date()) {
  return { from: getWeekdayDate("mon", now), until: getWeekdayDate("fri", now) }
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short", timeZone }).format(date)
}
