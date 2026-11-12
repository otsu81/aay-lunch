import type { HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, swedishWeekday } from "./scraper"

export class Kolgas implements Restaurant {
  public id = 9
  public restaurantName = "Kolgas"
  public url = "https://www.restaurangkolga.se/lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const menu: Record<string, string> = {}

    for (const header of doc.querySelectorAll("thead.lunch-day-header") as HTMLElement[]) {
      const dayText = header.querySelector("h3")?.textContent?.trim().split(/\s+/)[0]
      const key = swedishWeekday(dayText)
      const tbody = header.nextElementSibling as HTMLElement | null
      if (!key || !tbody) continue

      const items = Array.from(tbody.querySelectorAll("td.td_title"))
        .map((td) => (td as HTMLElement).textContent?.trim() ?? "")
        .filter(Boolean)

      if (items.length) menu[key] = items.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
