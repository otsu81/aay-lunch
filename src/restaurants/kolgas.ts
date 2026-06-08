import { DOMParser, type HTMLElement } from "linkedom"
import type { Restaurant } from "./restaurant"

const weekdayMapping: Record<string, string> = {
  måndag: "mon",
  tisdag: "tue",
  onsdag: "wed",
  torsdag: "thu",
  fredag: "fri",
}

export class Kolgas implements Restaurant {
  public restaurantName = "Kolgas"
  public url = "https://www.restaurangkolga.se/lunch/"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.url, { cf: { cacheTtl: 86400 } })
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")

    const menu: Record<string, string> = {}

    const headers = doc.querySelectorAll("thead.lunch-day-header") as HTMLElement[]

    headers.forEach((header) => {
      const h3 = header.querySelector("h3")
      const dayText = h3?.textContent?.trim().toLowerCase().split(/\s+/)[0]
      if (!dayText) return
      const key = weekdayMapping[dayText]
      if (!key) return

      const tbody = header.nextElementSibling as HTMLElement
      if (!tbody) return

      const items = Array.from(tbody.querySelectorAll("td.td_title")).map((td) =>
        (td as HTMLElement).textContent?.trim() ?? "",
      ).filter(Boolean)

      if (items.length) menu[key] = items.join("<br>")
    })

    return menu
  }
}
