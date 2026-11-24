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

export class Niagara implements Restaurant {
  public id = 5
  public restaurantName = "Niagara"
  public url = "https://restaurangniagara.se/lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const tabs = doc.querySelector(".e-n-tabs")
    if (!tabs) return unavailable("lunch tabs not found")

    const menu: Menu = {}

    for (const panel of queryAll(tabs, '[role="tabpanel"]')) {
      const key = parseWeekday(text(panel.querySelector("h3.elementor-heading-title")))
      if (!key) continue

      const items = queryAll(panel, ".lunchmeny_container").map((container) => {
        const title = text(container.querySelector(".lunch_title"))
        // The description holds the Swedish text first, then an English translation.
        const desc = container.querySelector(".lunch_desc")?.innerHTML.trim().split("<br>")[0] ?? ""
        return `<b>${title}</b>: ${desc}`
      })

      menu[key] = items.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
