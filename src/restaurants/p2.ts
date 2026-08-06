import { DOMParser, type HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchRestaurant, menuForCurrentWeek, pageIndicatesClosure, unavailable } from "./scraper"

const weekdayMapping: Record<string, string> = {
  måndag: "mon",
  tisdag: "tue",
  onsdag: "wed",
  torsdag: "thu",
  fredag: "fri",
}

export class P2 implements Restaurant {
  public restaurantName = "P2"
  public url = "https://restaurangp2.se/"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.url)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const pageText = doc.documentElement?.textContent || ""
    if (pageIndicatesClosure(pageText)) return closed()

    const dayContainers = Array.from(doc.querySelectorAll(".lunchmeny_wrapper"))
      .map((wrapper) => (wrapper as HTMLElement).closest(".e-con") as HTMLElement)
      .filter(Boolean) as HTMLElement[]
    if (!dayContainers.length) {
      console.error(`[${this.restaurantName}] No lunch menu containers found`)
      return unavailable("lunch menu containers not found")
    }

    const menu: Record<string, string> = {}

    dayContainers.forEach((container) => {
      const heading = container.querySelector("h3.elementor-heading-title")
      const dayText = heading?.textContent?.trim().toLowerCase()
      const day = dayText ? weekdayMapping[dayText] : undefined
      if (!day) return

      const items = Array.from(container.querySelectorAll(".lunchmeny_container"))
        .map((item) => {
          const title = (item as HTMLElement).querySelector(".lunch_title")?.textContent?.replace(/\s+/g, " ").trim()
          const desc = (item as HTMLElement).querySelector(".lunch_desc")?.textContent?.replace(/\s+/g, " ").trim()

          if (!title || !desc) return undefined
          return `<b>${title}</b>: ${desc}`
        })
        .filter(Boolean)

      if (items.length) menu[day] = items.join("<br>")
    })

    if (Object.keys(menu).length === 0) {
      console.error(`[${this.restaurantName}] No weekday menu parsed`)
      return unavailable("no weekday menu parsed")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
