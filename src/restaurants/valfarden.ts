import type { Menu, Weekday } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, query, queryAll } from "./scraper"

export const Valfarden: HtmlRestaurant = {
  id: 6,
  name: "Välfärden",
  url: "https://valfarden.nu/dagens-lunch/",

  parse(doc) {
    const menu: Menu = {}
    const section = query(doc, "article section:nth-of-type(2)")
    if (!section) return menu

    let currentDay: Weekday | undefined
    let currentDishes: string[] = []
    const flush = () => {
      if (currentDay) menu[currentDay] = currentDishes.length ? currentDishes.join("<br>") : "Stängt"
    }

    for (const p of queryAll(section, "p")) {
      // Not text(): collapsing whitespace changes the stored dishes; T9 switches it deliberately.
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

    return menu
  },
}
