import type { HTMLElement } from "linkedom"
import type { Menu } from "../weekdays"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, parseWeekday, unavailable } from "./scraper"

export class Clemens implements Restaurant {
  public id = 4
  public restaurantName = "Clemens Kött & Husman"
  public url = "https://www.clemenskott.se/restaurang/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const heading = (Array.from(doc.querySelectorAll("legend h2")) as HTMLElement[]).find((h) =>
      /veckans lunchmeny/i.test(h.textContent ?? ""),
    )
    const lunch = heading?.closest("fieldset")
    if (!lunch) return unavailable("weekly lunch menu not found")

    const menu: Menu = {}

    for (const entry of lunch.querySelectorAll(":scope > div") as HTMLElement[]) {
      const day = parseWeekday(entry.querySelector(".font-bold")?.textContent)
      const dish = entry.querySelector(".italic")?.textContent?.replace(/\s+/g, " ").trim()
      if (day && dish) menu[day] = dish
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
