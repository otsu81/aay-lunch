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
  unavailable,
} from "./scraper"

export class CafeLive implements Restaurant {
  public id = 7
  public restaurantName = "Café Live"
  public url = "https://cafelive.se/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const heading = queryAll(doc, "h1, h2, h3, h4, h5, h6").find((h) => /\bmeny\b/i.test(text(h)))
    if (!heading) return unavailable("lunch heading not found")

    const menu: Menu = {}

    for (
      let current: HTMLElement | null = heading.nextElementSibling;
      current && current.id !== "lunch-meny";
      current = current.nextElementSibling
    ) {
      if (current.tagName?.toLowerCase() !== "p" || !current.querySelector("strong")) continue

      // Day labels are sometimes split across several <strong> tags (e.g. an empty &nbsp;
      // one first), so read the whole paragraph.
      const dayKey = parseWeekday(text(current))
      if (!dayKey) continue

      const dishEl: HTMLElement | null = current.nextElementSibling
      const dish = dishEl?.tagName?.toLowerCase() === "p" ? text(dishEl) : ""
      if (dish) menu[dayKey] = dish
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
