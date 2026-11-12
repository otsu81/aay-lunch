import type { HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, swedishWeekday, unavailable } from "./scraper"

export class Valfarden implements Restaurant {
  public id = 6
  public restaurantName = "Välfärden"
  public url = "https://valfarden.nu/dagens-lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const section = doc.querySelector("article section:nth-of-type(2)")
    if (!section) return unavailable("lunch section not found")

    const menu: Record<string, string> = {}
    let currentDay: string | undefined
    let currentDishes: string[] = []
    const flush = () => {
      if (currentDay) menu[currentDay] = currentDishes.length ? currentDishes.join("<br>") : "Stängt"
    }

    for (const p of section.querySelectorAll("p") as HTMLElement[]) {
      const txt = p.textContent?.normalize("NFC").trim() || ""
      const dayHeader = txt.match(/^(Måndag|Tisdag|Onsdag|Torsdag|Fredag)/i)
      if (dayHeader) {
        flush()
        currentDay = swedishWeekday(dayHeader[1])
        currentDishes = []
      } else if (!["", "-", "–", "—"].includes(txt)) {
        currentDishes.push(txt)
      }
    }
    flush()

    return menuForCurrentWeek(menu, pageText, now)
  }
}
