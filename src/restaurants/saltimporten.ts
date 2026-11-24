import type { Menu } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, query, queryAll, text } from "./scraper"

export const Saltimporten: HtmlRestaurant = {
  id: 8,
  name: "Saltimporten",
  url: "https://www.saltimporten.com/",

  parse(doc) {
    const menu: Menu = {}
    const container = query(
      doc,
      "body > div > section > div > div > div > section > div > div > div > div:nth-of-type(2)",
    )
    if (!container) return menu

    for (const p of queryAll(container, "p")) {
      const weekday = query(p, "strong")
      const day = parseWeekday(text(weekday))
      const dish = text(weekday?.nextSibling)
      if (day && dish) menu[day] = dish
    }

    return menu
  },
}
