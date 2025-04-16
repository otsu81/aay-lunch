import { Hono } from 'hono'
import { Clemens } from './restaurants/clemens'

interface Env{}

const hono = new Hono<{Bindings: Env}>()
const clem = new Clemens('https://www.clemenskott.se/restaurang/')
const weekday = new Date().toLocaleString('en-US', {
	timeZone: 'Europe/Stockholm',
	weekday: 'short',
})

console.log(weekday.toLowerCase())
hono.get('/', async (c) => {
	await clem.generateMenu()

	const todaysMenu = await clem.getDayMenu(weekday)

	return c.text(todaysMenu)
})

export default hono