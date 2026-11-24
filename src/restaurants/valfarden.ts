import type { HTMLElement } from "linkedom"
import type { Menu, Weekday } from "../weekdays"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, parseWeekday, unavailable } from "./scraper"

export class Valfarden implements Restaurant {
  public id = 6
  public restaurantName = "Välfärden"
  public url = "https://valfarden.nu/dagens-lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const section = doc.querySelector("article section:nth-of-type(2)")
    if (!section) return unavailable("lunch section not found")

    const menu: Menu = {}
    let currentDay: Weekday | undefined
    let currentDishes: string[] = []
    const flush = () => {
      if (currentDay) menu[currentDay] = currentDishes.length ? currentDishes.join("<br>") : "Stängt"
    }

    for (const p of section.querySelectorAll("p") as HTMLElement[]) {
      const txt = p.textContent?.normalize("NFC").trim() || ""
      const day = parseWeekday(txt.split(/\s+/)[0])
      if (day) {
        flush()
        currentDay = day
        currentDishes = []
      } else if (!["", "-", "–", "—"].includes(txt)) {
        currentDishes.push(txt)
      }
    }
    flush()

    return menuForCurrentWeek(menu, pageText, now)
  }
}
