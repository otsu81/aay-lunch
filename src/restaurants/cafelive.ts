import type { HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, swedishWeekday, unavailable } from "./scraper"

export class CafeLive implements Restaurant {
  public id = 7
  public restaurantName = "Café Live"
  public url = "https://cafelive.se/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")) as HTMLElement[]
    const heading = headings.find((h) => /\bmeny\b/i.test(h.textContent || ""))
    if (!heading) return unavailable("lunch heading not found")

    const menu: Record<string, string> = {}

    for (
      let current = heading.nextElementSibling as HTMLElement | null;
      current && current.id !== "lunch-meny";
      current = current.nextElementSibling as HTMLElement | null
    ) {
      if (current.tagName?.toLowerCase() !== "p" || !current.querySelector("strong")) continue

      // Day labels are sometimes split across several <strong> tags (e.g. an empty &nbsp;
      // one first), so read the whole paragraph.
      const dayKey = swedishWeekday(current.textContent)
      if (!dayKey) continue

      const dishEl = current.nextElementSibling as HTMLElement | null
      const dish = dishEl?.tagName?.toLowerCase() === "p" ? dishEl.textContent?.replace(/\s+/g, " ").trim() : undefined
      if (dish) menu[dayKey] = dish
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
