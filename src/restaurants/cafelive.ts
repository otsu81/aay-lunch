import { DOMParser, type HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchRestaurant, menuForCurrentWeek, pageIndicatesClosure, unavailable } from "./scraper"

const weekdayMapping: Record<string, string> = {
  MÅNDAG: "mon",
  TISDAG: "tue",
  ONSDAG: "wed",
  TORSDAG: "thu",
  FREDAG: "fri",
}

export class CafeLive implements Restaurant {
  public restaurantName = "Café Live"
  public url = "https://cafelive.se/"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.url)

    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const pageText = doc.documentElement?.textContent || ""
    if (pageIndicatesClosure(pageText)) return closed()
    const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")) as HTMLElement[]
    const heading = headings.find((h) => /\bmeny\b/i.test(h.textContent || ""))
    if (!heading) {
      console.error(`[${this.restaurantName}] lunch heading not found`)
      return unavailable("lunch heading not found")
    }

    const menu: Record<string, string> = {}

    let current: HTMLElement | null = heading.nextElementSibling as HTMLElement | null
    while (current && current.id !== "lunch-meny") {
      if (current.tagName?.toLowerCase() !== "p") {
        current = current.nextElementSibling as HTMLElement | null
        continue
      }

      // Day headings sometimes split the label across multiple <strong> tags
      // (e.g. an empty &nbsp; strong before the day), so read the whole paragraph.
      const strong = current.querySelector("strong")
      const dayText = strong ? current.textContent?.trim() : undefined
      const dayKey = dayText ? weekdayMapping[dayText] : undefined
      if (!dayKey) {
        current = current.nextElementSibling as HTMLElement | null
        continue
      }

      const dishEl = current.nextElementSibling as HTMLElement | null
      if (dishEl?.tagName?.toLowerCase() === "p") {
        const dish = dishEl.textContent?.replace(/\s+/g, " ").trim()
        if (dish) menu[dayKey] = dish
      }

      current = current.nextElementSibling as HTMLElement | null
    }

    if (Object.keys(menu).length === 0) {
      console.error(`[${this.restaurantName}] No weekday menu parsed`)
      return unavailable("no weekday menu parsed")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
