import { type Context, Hono } from "hono"
import { getWeekday } from "./dates"
import { getWeekdayMenus } from "./db"
import { renderWeekdayMenu } from "./page"
import { refreshMenus } from "./refresh"
import { restaurants } from "./restaurants/all"
import { isWeekday, type Weekday } from "./weekdays"

const hono = new Hono<{ Bindings: Env }>()

async function getWeekdayMenu(weekday: Weekday, c: Context<{ Bindings: Env }>) {
  const rows = await getWeekdayMenus(c.env.db, weekday)
  return c.html(renderWeekdayMenu(rows, restaurants, weekday))
}

hono.get("/refresh", async (c) => c.json(await refreshMenus(c.env.db)))

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
