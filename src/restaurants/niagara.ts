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

export class Niagara implements Restaurant {
  public restaurantName = "Niagara"
  public url = "https://restaurangniagara.se/lunch/"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.url)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const pageText = doc.documentElement?.textContent || ""
    if (pageIndicatesClosure(pageText)) return closed()

    const tabs = doc.querySelector(".e-n-tabs")
    if (!tabs) return unavailable("lunch tabs not found")

    const menu: Record<string, string> = {}

    const panels = tabs.querySelectorAll('[role="tabpanel"]') as HTMLElement[]

    panels.forEach((panel) => {
      const heading = panel.querySelector("h3.elementor-heading-title")
      const dayText = heading?.textContent?.trim().toLowerCase()
      if (!dayText) return
      const key = weekdayMapping[dayText]
      if (!key) return

      const items = Array.from(panel.querySelectorAll(".lunchmeny_container")).map((container) => {
        const titleEl = (container as HTMLElement).querySelector(".lunch_title")
        const descEl = (container as HTMLElement).querySelector(".lunch_desc")
        const title = titleEl?.textContent?.trim() ?? "" // if there's no title just skip it
        const desc = descEl?.innerHTML.trim().split("<br>")[0] ?? "" // only extract the swedish dish description

        return `<b>${title}</b>: ${desc}`
      })

      menu[key] = items.join("<br>")
    })

    return menuForCurrentWeek(menu, pageText, now)
  }
}
