import type { HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, swedishWeekday, unavailable } from "./scraper"

export class Saltimporten implements Restaurant {
  public id = 8
  public restaurantName = "Saltimporten"
  public url = "https://www.saltimporten.com/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const container = doc.querySelector(
      "body > div > section > div > div > div > section > div > div > div > div:nth-of-type(2)",
    )
    if (!container) return unavailable("lunch menu container not found")

    const menu: Record<string, string> = {}

    for (const p of container.querySelectorAll("p") as HTMLElement[]) {
      const weekday = p.querySelector("strong")
      const day = swedishWeekday(weekday?.textContent)
      const dish = weekday?.nextSibling?.textContent
      if (day && dish) menu[day] = dish
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
