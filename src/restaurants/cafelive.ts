import { DOMParser, type HTMLElement } from "linkedom"
import type { Restaurant } from "./restaurant"

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

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.url, {
      cf: {
        cacheTtl: 86400,
      },
    })

    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")) as HTMLElement[]
    const heading = headings.find((h) => /lunchmeny/i.test(h.textContent || ""))
    if (!heading) {
      console.error(`[${this.restaurantName}] lunch heading not found`)
      return undefined
    }

    const menu: Record<string, string> = {}

    let current: HTMLElement | null = heading.nextElementSibling as HTMLElement | null
    while (current && current.id !== "lunch-meny") {
      if (current.tagName?.toLowerCase() !== "p") {
        current = current.nextElementSibling as HTMLElement | null
        continue
      }

      const strong = current.querySelector("strong")
      const dayText = strong?.textContent?.trim()
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
      return undefined
    }

    return menu
  }
}
