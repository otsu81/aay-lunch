import type { Menu, Weekday } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, queryAll, text } from "./scraper"

export const Varv: HtmlRestaurant = {
  id: 0,
  name: "Varv Malmö",
  url: "https://www.varvmalmo.com/menu",

  parse(doc) {
    const menu: Menu = {}
    const menuContent = queryAll(doc, ".sqs-html-content").find((content) =>
      queryAll(content, "h2").some((heading) => parseWeekday(text(heading))),
    )
    if (!menuContent) return menu

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

    return menu
  },
}
