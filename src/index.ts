import { type Context, Hono } from "hono"
import { getWeekday } from "./dates"
import { getWeekdayMenus } from "./db"
import { isWeekday, type Weekday } from "./menu"
import { renderWeekdayMenu } from "./page"
import { refreshMenus } from "./refresh"
import { restaurants } from "./restaurants/all"

const hono = new Hono<{ Bindings: Env }>()

async function renderDay(c: Context<{ Bindings: Env }>, weekday: Weekday, now: Date) {
  const rows = await getWeekdayMenus(c.env.db, weekday, now)
  return c.html(renderWeekdayMenu(rows, restaurants, weekday, now))
}

hono.get("/refresh", async (c) => c.json(await refreshMenus(c.env.db, new Date())))

hono.get("/:weekday", async (c) => {
  const weekday = c.req.param("weekday")
  return isWeekday(weekday) ? renderDay(c, weekday, new Date()) : c.notFound()
})

hono.get("/", async (c) => {
  const now = new Date()
  const weekday = getWeekday(now)

  if (!weekday) return c.text("go home and be a family man, there's no lunch menu on weekends")
  return renderDay(c, weekday, now)
})

export default {
  fetch: hono.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(refreshMenus(env.db, new Date()))
  },
}
