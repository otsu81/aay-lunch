import { DOMParser, type HTMLElement } from "linkedom"
import type { Restaurant } from "./restaurant"

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

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.url, {
      cf: { cacheTtl: 86400 },
    })
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")

    const dayContainers = Array.from(doc.querySelectorAll(".lunchmeny_wrapper")).map((wrapper) =>
      (wrapper as HTMLElement).closest(".e-con") as HTMLElement,
    ).filter(Boolean) as HTMLElement[]
    if (!dayContainers.length) {
      console.error(`[${this.restaurantName}] No lunch menu containers found`)
      return undefined
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
      return undefined
    }

    return menu
  }
}
