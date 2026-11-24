import type { Menu } from "../weekdays"
import type { MenuResult, Restaurant } from "./restaurant"
import {
  closed,
  fetchDocument,
  menuForCurrentWeek,
  pageIndicatesClosure,
  parseWeekday,
  queryAll,
  text,
  unavailable,
} from "./scraper"

export class Clemens implements Restaurant {
  public id = 4
  public restaurantName = "Clemens Kött & Husman"
  public url = "https://www.clemenskott.se/restaurang/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const heading = queryAll(doc, "legend h2").find((h) => /veckans lunchmeny/i.test(text(h)))
    const lunch = heading?.closest("fieldset")
    if (!lunch) return unavailable("weekly lunch menu not found")

    const menu: Menu = {}

    for (const entry of queryAll(lunch, ":scope > div")) {
      const day = parseWeekday(text(entry.querySelector(".font-bold")))
      const dish = text(entry.querySelector(".italic"))
      if (day && dish) menu[day] = dish
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
