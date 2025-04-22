import { format, toZonedTime } from 'date-fns-tz'
import { enUS } from 'date-fns/locale'
import { Hono } from 'hono'
import { Db } from './db'
import { Generator } from './generator'
import { Clemens } from './restaurants/clemens'
import { MiaMarias } from './restaurants/miamaria'
import { Niagara } from './restaurants/niagara'
import { Restaurant } from './restaurants/restaurant'
import { Saltimporten } from './restaurants/saltimporten'
import { Valfarden } from './restaurants/valfarden'

interface Env {
  db: D1Database
}

const hono = new Hono<{ Bindings: Env }>()

async function getWeekday(): Promise<string> {
  const now = new Date()
  const sweDate = toZonedTime(now, 'Europe/Stockholm')
  const weekday = format(sweDate, 'EEE', {
    locale: enUS
  }).toLowerCase()

  console.log({ weekday })
  return weekday
}

hono.get('/refresh', async (c) => {
  const resDb = new Db(c.env.db)
  const restaurants = new Set<Restaurant>()
  let i = 0
  restaurants.add(new Clemens(i++))
  restaurants.add(new MiaMarias(i++))
  restaurants.add(new Niagara(i++))
  restaurants.add(new Valfarden(i++))
  restaurants.add(new Saltimporten(i++))

  const promises = Array.from(restaurants).map((r) => resDb.refreshMenu(r))
  const resolved = await Promise.all(promises)

  return c.json(resolved)
})

hono.get('/', async (c) => {
  const weekday = await getWeekday()

  if (weekday === 'sat' || weekday === 'sun') {
    return c.text("go home and be a family man, there's no lunch menu on weekends")
  }
  const resDb = new Db(c.env.db)
  const gen = new Generator(resDb)
  const todaysMenu = await gen.generateWeekdayMenu(weekday)

  return c.html(todaysMenu)
})

export default hono
