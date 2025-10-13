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

hono.get("/refresh", async (c) => {
  const resDb = new Db(c.env.db)
  const restaurants = new Set<Restaurant>()
  let i = 0
  restaurants.add(new Clemens(i++))
  restaurants.add(new MiaMarias(i++))
  restaurants.add(new Niagara(i++))
  restaurants.add(new Valfarden(i++))
  restaurants.add(new Saltimporten(i++))
  restaurants.add(new ThapThim(i++))

  const promises = Array.from(restaurants).map((r) => resDb.refreshMenu(r))
  const resolved = await Promise.all(promises)

  // set timestamp of last refresh
  await resDb.setLastRefreshTimpeStamp()

  return c.json(resolved)
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

export default hono
