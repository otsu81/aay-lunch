import type { Menu } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, query, queryAll, text } from "./scraper"

export const Clemens: HtmlRestaurant = {
  id: 4,
  name: "Clemens Kött & Husman",
  url: "https://www.clemenskott.se/restaurang/",

  parse(doc) {
    const menu: Menu = {}
    const heading = queryAll(doc, "legend h2").find((h) => /veckans lunchmeny/i.test(text(h)))
    const lunch = heading?.closest("fieldset")
    if (!lunch) return menu

    for (const entry of queryAll(lunch, ":scope > div")) {
      const day = parseWeekday(text(query(entry, ".font-bold")))
      const dish = text(query(entry, ".italic"))
      if (day && dish) menu[day] = dish
    }

    return menu
  },
}
