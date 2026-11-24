import type { Menu, Weekday } from "../weekdays"
import type { MenuResult, Restaurant } from "./restaurant"
import {
  closed,
  fetchDocument,
  menuForCurrentWeek,
  pageIndicatesClosure,
  parseWeekday,
  queryAll,
  text,
  unavailable,
} from "./scraper"

export class Varv implements Restaurant {
  public id = 0
  public restaurantName = "Varv Malmö"
  public url = "https://www.varvmalmo.com/menu"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const menuContent = queryAll(doc, ".sqs-html-content").find((content) =>
      queryAll(content, "h2").some((heading) => parseWeekday(text(heading))),
    )
    if (!menuContent) return unavailable("lunch menu content not found")

    const menu: Menu = {}
    let currentDay: Weekday | undefined

    for (const child of queryAll(menuContent, ":scope > *")) {
      const tag = child.tagName?.toLowerCase()
      const line = text(child)
      if (!line) continue

      if (tag === "h2") {
        const day = parseWeekday(line)
        if (day) {
          currentDay = day
          menu[currentDay] = ""
          continue
        }

        if (currentDay) break
        continue
      }

      if (tag !== "p" || !currentDay) continue
      if (/^or$/i.test(line) || /^All dishes are available/i.test(line)) continue

      menu[currentDay] = menu[currentDay] ? `${menu[currentDay]}<br>${line}` : line
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
