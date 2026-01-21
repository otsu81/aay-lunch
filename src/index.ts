import { enUS } from "date-fns/locale"
import { format, toZonedTime } from "date-fns-tz"
import { type Context, Hono } from "hono"
import { Db } from "./db"
import { Generator } from "./generator"
import { Clemens } from "./restaurants/clemens"
import { MiaMarias } from "./restaurants/miamaria"
import { Niagara } from "./restaurants/niagara"
import type { Restaurant } from "./restaurants/restaurant"
import { Saltimporten } from "./restaurants/saltimporten"
import { ThapThim } from "./restaurants/thapthim"
import { Valfarden } from "./restaurants/valfarden"

const weekdays = new Set(["mon", "tue", "wed", "thu", "fri"])

const hono = new Hono<{ Bindings: Env }>()

async function getWeekday(day?: string): Promise<string> {
  if (day && weekdays.has(day)) return day
  const now = new Date()
  const sweDate = toZonedTime(now, "Europe/Stockholm")
  const weekday = format(sweDate, "EEE", {
    locale: enUS,
  }).toLowerCase()

  return weekday
}

async function getWeekdayMenu(weekday: string, c: Context<{ Bindings: Env }>) {
  const resDb = new Db(c.env.db)
  const gen = new Generator(resDb)
  const todaysMenu = await gen.generateWeekdayMenu(weekday)

  return c.html(todaysMenu)
}

async function refreshMenus(db: D1Database) {
  const resDb = new Db(db)
  let i = 0
  const restaurants: Restaurant[] = [
    new Clemens(i++),
    new MiaMarias(i++),
    new Niagara(i++),
    new Valfarden(i++),
    new Saltimporten(i++),
    new ThapThim(i++),
  ]

  const results = await Promise.allSettled(restaurants.map((r) => resDb.refreshMenu(r)))

  const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value)
  const failed = results
    .map((r, i) => (r.status === "rejected" ? restaurants[i].restaurantName : null))
    .filter(Boolean)

  if (failed.length) {
    console.error(`failed to refresh: ${failed.join(", ")}`)
  }

  await resDb.setLastRefreshTimestamp()

  return { succeeded, failed }
}

hono.get("/refresh", async (c) => {
  const result = await refreshMenus(c.env.db)
  return c.text(JSON.stringify(result, null, 2), 200, { "Content-Type": "application/json" })
})

hono.get("/:weekday", async (c) => {
  const weekday = c.req.param("weekday")
  if (weekdays.has(weekday)) return getWeekdayMenu(weekday, c)

  return c.status(403)
})

hono.get("/", async (c) => {
  const weekday = await getWeekday()

  if (weekday === "sat" || weekday === "sun") {
    return c.text("go home and be a family man, there's no lunch menu on weekends")
  }
  return getWeekdayMenu(weekday, c)
})

export default {
  fetch: hono.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(refreshMenus(env.db))
  },
}
