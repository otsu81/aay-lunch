import { Hono } from 'hono'
import { Db } from './db'
import { Generator } from './generator'
import { Clemens } from './restaurants/clemens'
import { MiaMarias } from './restaurants/miamaria'
import { Niagara } from './restaurants/niagara'
import { Restaurant } from './restaurants/restaurant'

interface Env {
  db: D1Database
}

const hono = new Hono<{ Bindings: Env }>()

const weekday = new Date()
  .toLocaleString('en-US', {
    timeZone: 'Europe/Stockholm',
    weekday: 'short',
  })
  .toLowerCase()

hono.get('/refresh', async (c) => {
  const resDb = new Db(c.env.db)
  const restaurants = new Set<Restaurant>()
  restaurants.add(new Clemens(0))
  restaurants.add(new MiaMarias(1))
  restaurants.add(new Niagara(2))

  const promises = Array.from(restaurants).map((r) => resDb.refreshMenu(r))
  const resolved = await Promise.all(promises)

  return c.json(resolved)
})

hono.get('/', async (c) => {
  if (weekday === 'sat' || weekday === 'sun') {
    return c.text("go home and be a family man, there's no lunch menu on weekends")
  }
  const resDb = new Db(c.env.db)
  const gen = new Generator(resDb)
  const todaysMenu = await gen.generateWeekdayMenu(weekday)

  return c.html(todaysMenu)
})

export default hono
