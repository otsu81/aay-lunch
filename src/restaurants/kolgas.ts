import type { HTMLElement } from "linkedom"
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
} from "./scraper"

export class Kolgas implements Restaurant {
  public id = 9
  public restaurantName = "Kolgas"
  public url = "https://www.restaurangkolga.se/lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const menu: Menu = {}

    for (const header of queryAll(doc, "thead.lunch-day-header")) {
      const key = parseWeekday(text(header.querySelector("h3")).split(" ")[0])
      const tbody: HTMLElement | null = header.nextElementSibling
      if (!key || !tbody) continue

      const items = queryAll(tbody, "td.td_title").map(text).filter(Boolean)

      if (items.length) menu[key] = items.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
