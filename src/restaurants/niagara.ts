import type { HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, swedishWeekday, unavailable } from "./scraper"

export class Niagara implements Restaurant {
  public id = 5
  public restaurantName = "Niagara"
  public url = "https://restaurangniagara.se/lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const tabs = doc.querySelector(".e-n-tabs")
    if (!tabs) return unavailable("lunch tabs not found")

    const menu: Record<string, string> = {}

    for (const panel of tabs.querySelectorAll('[role="tabpanel"]') as HTMLElement[]) {
      const key = swedishWeekday(panel.querySelector("h3.elementor-heading-title")?.textContent)
      if (!key) continue

      const items = (Array.from(panel.querySelectorAll(".lunchmeny_container")) as HTMLElement[]).map((container) => {
        const title = container.querySelector(".lunch_title")?.textContent?.trim() ?? ""
        // The description holds the Swedish text first, then an English translation.
        const desc = container.querySelector(".lunch_desc")?.innerHTML.trim().split("<br>")[0] ?? ""
        return `<b>${title}</b>: ${desc}`
      })

      menu[key] = items.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
