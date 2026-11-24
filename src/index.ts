import { type Context, Hono } from "hono"
import { getWeekday } from "./dates"
import { Db } from "./db"
import { renderWeekdayMenu } from "./page"
import { restaurants } from "./restaurants/all"
import { isWeekday, type Weekday } from "./weekdays"

const hono = new Hono<{ Bindings: Env }>()

async function getWeekdayMenu(weekday: Weekday, c: Context<{ Bindings: Env }>) {
  const rows = await new Db(c.env.db).getWeekdayMenus(weekday)
  return c.html(renderWeekdayMenu(rows, restaurants, weekday))
}

async function refreshMenus(db: D1Database) {
  const resDb = new Db(db)
  const results = await Promise.allSettled(restaurants.map((r) => resDb.refreshMenu(r)))

  const succeeded: string[] = []
  const unavailable: { restaurant: string; status: string; reason: string }[] = []
  const failed: string[] = []
  results.forEach((result, i) => {
    const name = restaurants[i].name
    if (result.status === "rejected") failed.push(name)
    else if (result.value.status === "available") succeeded.push(name)
    else unavailable.push({ restaurant: name, status: result.value.status, reason: result.value.reason })
  })

  if (failed.length) console.error(`failed to refresh: ${failed.join(", ")}`)
  for (const u of unavailable) console.warn(`${u.restaurant} ${u.status}: ${u.reason}`)

  return { succeeded, unavailable, failed }
}

hono.get("/refresh", async (c) => {
  const result = await refreshMenus(c.env.db)
  return c.text(JSON.stringify(result, null, 2), 200, { "Content-Type": "application/json" })
})

hono.get("/:weekday", async (c) => {
  const weekday = c.req.param("weekday")
  return isWeekday(weekday) ? getWeekdayMenu(weekday, c) : c.notFound()
})

hono.get("/", async (c) => {
  const weekday = getWeekday()

  if (!weekday) return c.text("go home and be a family man, there's no lunch menu on weekends")
  return getWeekdayMenu(weekday, c)
})

export default {
  fetch: hono.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(refreshMenus(env.db))
  },
}
