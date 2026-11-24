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

export class P2 implements Restaurant {
  public id = 3
  public restaurantName = "P2"
  public url = "https://restaurangp2.se/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const dayContainers = queryAll(doc, ".lunchmeny_wrapper")
      .map((wrapper) => wrapper.closest(".e-con"))
      .filter(Boolean)
    if (!dayContainers.length) return unavailable("lunch menu containers not found")

    const menu: Menu = {}

    for (const container of dayContainers) {
      const day = parseWeekday(text(container.querySelector("h3.elementor-heading-title")))
      if (!day) continue

      const items = queryAll(container, ".lunchmeny_container").flatMap((item) => {
        const title = text(item.querySelector(".lunch_title"))
        const desc = text(item.querySelector(".lunch_desc"))
        return title && desc ? [`<b>${title}</b>: ${desc}`] : []
      })

      if (items.length) menu[day] = items.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
