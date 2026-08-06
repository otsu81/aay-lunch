import { DOMParser, type HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchRestaurant, menuForCurrentWeek, pageIndicatesClosure, unavailable } from "./scraper"

const weekdayMapping: Record<string, string> = {
  måndag: "mon",
  tisdag: "tue",
  onsdag: "wed",
  torsdag: "thu",
  fredag: "fri",
}

export class Saltimporten implements Restaurant {
  public restaurantName = "Saltimporten"
  public url = "https://www.saltimporten.com/"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.url)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const pageText = doc.documentElement?.textContent || ""
    if (pageIndicatesClosure(pageText)) return closed()

    const container = doc.querySelector(
      "body > div > section > div > div > div > section > div > div > div > div:nth-of-type(2)",
    )
    if (!container) return unavailable("lunch menu container not found")

    const menu: Record<string, string> = {}

    const ps = container.querySelectorAll("p") as HTMLElement[]

    ps.forEach((p) => {
      const strongElement = p.querySelector("strong") // assume the weekday is strong
      if (!strongElement) return
      const next = strongElement.nextSibling

      const dayText = strongElement.textContent.toLowerCase().trim()
      const dish = next.textContent

      const day = weekdayMapping[dayText]
      if (!day) return
      menu[day] = dish
    })
    return menuForCurrentWeek(menu, pageText, now)
  }
}
