import type { HTMLElement } from "linkedom"
import type { Menu } from "../weekdays"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, parseWeekday, unavailable } from "./scraper"

const clean = (el: HTMLElement | null) => el?.textContent?.replace(/\s+/g, " ").trim()

export class P2 implements Restaurant {
  public id = 3
  public restaurantName = "P2"
  public url = "https://restaurangp2.se/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const dayContainers = Array.from(doc.querySelectorAll(".lunchmeny_wrapper"))
      .map((wrapper) => (wrapper as HTMLElement).closest(".e-con") as HTMLElement | null)
      .filter((c): c is HTMLElement => !!c)
    if (!dayContainers.length) return unavailable("lunch menu containers not found")

    const menu: Menu = {}

    for (const container of dayContainers) {
      const day = parseWeekday(container.querySelector("h3.elementor-heading-title")?.textContent)
      if (!day) continue

      const items = (Array.from(container.querySelectorAll(".lunchmeny_container")) as HTMLElement[]).flatMap(
        (item) => {
          const title = clean(item.querySelector(".lunch_title"))
          const desc = clean(item.querySelector(".lunch_desc"))
          return title && desc ? [`<b>${title}</b>: ${desc}`] : []
        },
      )

      if (items.length) menu[day] = items.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
