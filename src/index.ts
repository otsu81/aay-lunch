import { Hono } from 'hono'
import { Restaurant } from './restaurants/restaurant'
import { Clemens } from './restaurants/clemens'
import { Generator } from './generator'
import { Db } from './db'

interface Env{
	db: D1Database
}

const hono = new Hono<{Bindings: Env}>()

const weekday = new Date().toLocaleString('en-US', {
	timeZone: 'Europe/Stockholm',
	weekday: 'short',
}).toLowerCase()

hono.get('/refresh', async (c, next) => {
	const resDb = new Db(c.env.db)
	const restaurants = new Map<number, Restaurant>()
	const clem = new Clemens(0)
	restaurants.set(0, clem)
	const menu = await resDb.refreshMenu(clem)
	return c.json(menu)
})

hono.get('/', async (c) => {
	if (weekday === 'sat' || weekday === 'sun') {
		return c.text('go home and be a family man, there\'s no lunch menu on weekends')
	}
	const resDb = new Db(c.env.db)
	const gen = new Generator(resDb)
	const todaysMenu = await gen.generateWeekdayMenu(weekday)

	return c.html(todaysMenu)
	
})

export default hono